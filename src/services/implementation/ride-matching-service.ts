import { RedisService } from '@Pick2Me/shared/redis';
import { emitToRoom, emitToUser } from '@/utils/socket-emit';
import { EventProducer } from '@/events/publisher';
import { getIo } from '@/server/socket';
import { RIDE_OFFER_PREFIX, RIDE_QUEUE_PREFIX } from '@Pick2Me/shared/constants';
import { BookRideResponse } from '@/types/event-types';
import { PresenceService } from '@/utils/socket-cache';

const OFFER_TIMEOUT = 30000;

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
    console.log('prosess ride ');

    const nearbyDrivers = await this.redisService.findNearbyDrivers(
      pickupCoordinates.latitude,
      pickupCoordinates.longitude,
      5
    );

    if (nearbyDrivers.length === 0) {
      return this.handleNoDriversAvailable(rideId, rideData.user.userId);
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
      return this.handleNoDriversAvailable(rideId, rideData.user.userId);
    }

    await this.redisService.set(`${RIDE_OFFER_PREFIX}${rideId}`, driverId, 35);

    console.log(`Offering ride ${rideId} to driver ${driverId}`);

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
    // if (currentOfferedDriver !== driverId && action !== 'TIMEOUT') {
    //   console.warn(`Race condition or expired offer: ${driverId} tried to ${action}`);
    //   return; // Ignore late responses
    // }

    if (action === 'ACCEPT') {
      await this.confirmBooking(rideId, driverId, rideData);
    } else {
      if (action === 'DECLINE') {
        await EventProducer.updateDriverRideStatusCount({ driverId, status: 'DECLINE' });
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
    await EventProducer.publishDriverAccepted({ id: rideData.id, driver, status: 'ACCEPT' });

    const userSocket = await PresenceService.getSockets(rideData.user.userId);
    const driverSocket = await PresenceService.getSockets(driverId);

    const rideRoom = `ride:${rideId}`;
    if (userSocket) userSocket.join(rideRoom);
    if (driverSocket) driverSocket.join(rideRoom);

    emitToRoom(rideRoom, 'ride:started', {
      driver: driverDetails,
      user: rideData.user,
      trackingId: rideRoom,
    });
  }

  private async handleNoDriversAvailable(rideId: string, userId: string) {
    await EventProducer.publishRideNoDrivers(rideId);
    emitToUser(userId, 'ride:error', { message: 'No drivers available nearby' });
  }

  private async prioritizeDrivers(drivers: any[]) {
    return drivers;
  }

  // private async getSocketByUserId(userId: string) {
  //   const io = getIo();
  //   const sockets = await io.in(`user:${userId}`).fetchSockets();
  //   return sockets[0];
  // }
}
