import { RedisService } from '@Pick2Me/shared/redis';
import { emitToRoom, emitToUser } from '@/utils/socket-emit';
import { EventProducer } from '@/events/publisher';
import { getIo } from '@/server/socket';
import { HEARTBEAT_PREFIX, RIDE_OFFER_PREFIX, RIDE_QUEUE_PREFIX } from '@Pick2Me/shared/constants';
import { BookRideResponse } from '@/types/event-types';
import { PresenceService } from '@/utils/socket-cache';
import { container } from '@/config/inversify.config';
import { INotificationService } from '../interfaces/i-notification-service';
import { TYPES } from '@/types/inversify-types';

const OFFER_TIMEOUT = 30000;
const notificationService = container.get<INotificationService>(TYPES.NotificationService);
export class RideMatchingService {
  private static instance: RideMatchingService;
  private redisService = RedisService.getInstance();

  private offerTimeouts: Map<string, NodeJS.Timeout> = new Map();

  static getInstance() {
    if (!this.instance) this.instance = new RideMatchingService();
    return this.instance;
  }

  public async processRideRequest(rideData: BookRideResponse) {
    const { rideId, pickupCoordinates } = rideData;

    const nearbyDrivers = await this.redisService.findNearbyDrivers(
      pickupCoordinates.latitude,
      pickupCoordinates.longitude,
      5
    );

    if (nearbyDrivers.length === 0) {
      return this.handleNoDriversAvailable(rideData.id, rideId, rideData.user.userId);
    }

    const sortedDrivers = await this.prioritizeDrivers(nearbyDrivers);

    const queueKey = `${RIDE_QUEUE_PREFIX}${rideId}`;
    const driverIds = sortedDrivers.map((d) => d.driverId);
    await this.redisService.raw().rpush(queueKey, ...driverIds);
    await this.redisService.raw().expire(queueKey, 600); // 10 min TTL

    // Start the Loop
    this.processNextDriver(rideId, rideData);
  }

  private async processNextDriver(rideId: string, rideData: BookRideResponse) {
    const queueKey = `${RIDE_QUEUE_PREFIX}${rideId}`;

    // const isCancelled = await this.checkIfRideCancelled(rideId);
    // if(isCancelled) return;

    const driverId = await this.redisService.raw().lpop(queueKey);

    if (!driverId) {
      return this.handleNoDriversAvailable(rideData.id, rideId, rideData.user.userId);
    }

    await this.redisService.set(`${RIDE_OFFER_PREFIX}${rideId}`, driverId, 35);

    emitToUser(driverId, 'ride:request', {
      ...rideData,
      timeout: 30,
    });

    emitToUser(rideData.user.userId, 'ride:status', {
      status: 'SEARCHING',
      currentDriverId: driverId,
    });

    const timeout = setTimeout(async () => {
      console.log(`Driver ${driverId} timed out`);
      await this.handleDriverResponse(rideId, driverId, 'TIMEOUT', rideData);
    }, OFFER_TIMEOUT);

    this.offerTimeouts.set(rideId, timeout);
  }

  public async handleDriverResponse(
    rideId: string,
    driverId: string,
    action: 'ACCEPT' | 'DECLINE' | 'TIMEOUT',
    rideData: BookRideResponse
  ) {
    const existingTimeout = this.offerTimeouts.get(rideId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.offerTimeouts.delete(rideId);
    }

    const currentOfferedDriver = await this.redisService.get(`${RIDE_OFFER_PREFIX}${rideId}`);
    if (currentOfferedDriver !== driverId && action !== 'TIMEOUT') {
      console.warn(`Race condition or expired offer: ${driverId} tried to ${action}`);
      return; // Ignore late responses
    }

    if (action === 'ACCEPT') {
      await this.confirmBooking(rideId, driverId, rideData);
    } else {
      if (action === 'DECLINE' || action === 'TIMEOUT') {
        await EventProducer.updateDriverRideStatusCount({ driverId, status: 'DECLINE' });
        const notification = await notificationService.createNotification({
          receiverId: driverId,
          title: `Ride ${rideData.rideId} canceled`,
          type: 'ride',
          body: `Your cancellation count increased. This may reduce your priority for getting the next ride.
`,
        });
        emitToUser(driverId, 'notification', notification);
      }

      // Remove the offer lock
      await this.redisService.remove(`${RIDE_OFFER_PREFIX}${rideId}`);

      // Move to next driver
      await this.processNextDriver(rideId, rideData);
    }
  }

  private async confirmBooking(rideId: string, driverId: string, rideData: BookRideResponse) {
    await this.redisService.remove(`${RIDE_QUEUE_PREFIX}${rideId}`);
    await this.redisService.remove(`${RIDE_OFFER_PREFIX}${rideId}`);

    const driverDetails = await this.redisService.getOnlineDriverDetails(driverId);
    const driver = {
      driverId: driverDetails?.driverId || '',
      driverName: driverDetails?.name || '',
      driverNumber: driverDetails?.driverNumber || '',
      driverProfile: driverDetails?.driverPhoto || '',
    };

    const driverCoordinates = await this.redisService.getDriverGeoPosition(driverId);

    await this.redisService.moveDriverToInRideGeo(driverId);

    await this.redisService.remove(`${HEARTBEAT_PREFIX}${driverId}`);
    const heartbeatPayload = {
      rideId: rideData.rideId,
      user: rideData.user,
      driver: driver,
      pickupCoordinates: rideData.pickupCoordinates,
      dropOffCoordinates: rideData.dropOffCoordinates
    }
    await this.redisService.setHeartbeat(driverId, 120, true, heartbeatPayload);
    await EventProducer.publishDriverAccepted({ id: rideData.id, driver, status: 'ACCEPT' });

    const driverNotification = await notificationService.createNotification({
      receiverId: driverId,
      title: `Ride ${rideData.rideId} accepted`,
      type: 'ride',
      body: `You accepted the ride. Head to the tracking page to check the pickup details.`,
    });

    const userNotification = await notificationService.createNotification({
      receiverId: rideData.user.userId,
      title: `${driver.driverName} accepted your ride`,
      type: 'ride',
      body: `Your ride ${rideData.rideId} is now confirmed. Open the tracking page to follow the driver.`,
    });

    const io = getIo();
    const rideRoom = `ride:${rideId}`;

    const userSocketIds = (await PresenceService.getSockets(rideData.user.userId)) || [];
    const driverSocketIds = (await PresenceService.getSockets(driverId)) || [];

    for (const sid of [...userSocketIds, ...driverSocketIds]) {
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.join(rideRoom);
    }

    const serverTs = Date.now();
    const point = {
      driverId: driverId,
      rideId: rideData.rideId,
      lat: driverCoordinates?.latitude,
      lng: driverCoordinates?.longitude,
      accuracy: null,
      deviceTs: null,
      serverTs,
      seq: null,
      heading: null,
      speed: null,
    };

    const driverLocation = {
      driverId: point.driverId,
      rideId: point.rideId,
      lat: point.lat,
      lng: point.lng,
      serverTs: point.serverTs,
      deviceTs: point.deviceTs,
      seq: point.seq,
      heading: point.heading,
      speed: point.speed,
    };

    rideData.driver = driver;
    rideData.status = 'Accepted';

    emitToRoom(rideRoom, 'ride:accepted', {
      rideData,
      userNotification,
      driverNotification,
      driverLocation,
    });
  }

  private async handleNoDriversAvailable(_id: string, rideId: string, userId: string) {
    await EventProducer.publishRideNoDrivers(_id);
    const userNotification = await notificationService.createNotification({
      receiverId: userId,
      title: `Ride ${rideId} canceled`,
      type: 'ride',
      body: `No drivers are available nearby right now.`,
    });

    emitToUser(userId, 'ride:canceled', {
      message: 'No drivers available nearby',
      userNotification,
    });
  }

  private async prioritizeDrivers(drivers: any[]) {
    return drivers;
  }
}
