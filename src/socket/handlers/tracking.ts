import { RideMatchingService } from '@/services/implementation/ride-matching-service';
import { emitToRoom, emitToUser } from '@/utils/socket-emit';
import { Coordinates } from '@Pick2Me/shared/interfaces';
import { getRedisService } from '@Pick2Me/shared/redis';
import { Socket } from 'socket.io';

export function attach(socket: Socket) {
  socket.on('driver:heartbeat', (data: { timestamp: Date; location: Coordinates }) => {
    console.log('driver:heartbeat', data.timestamp);
    console.log(socket.data.user.id);

    const redisService = getRedisService();
    redisService.setHeartbeat(socket.data.user.id, 60);
  });

  socket.on('inride:driver:heartbeat', (data: { timestamp: Date; location: Coordinates }) => {
    console.log('inride:driver:heartbeat', data.timestamp);

    const redisService = getRedisService();
    redisService.setHeartbeat(socket.data.user.id, 60, true);
  });

  socket.on(
    'driver:location:update',
    (data: { latitude: number; longitude: number; accuracy: number; timestamp: TimeRanges }) => {
      try {
        console.log('driver:location:update', data);
        const redisService = getRedisService();
        const user = socket.data.user;

        redisService.updateDriverGeo(user.id, {
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } catch (error) {
        console.log(error);
        const userId = socket.data.user.id;
        emitToUser(userId, 'error', 'error message sample');
      }
    }
  );

  socket.on('inride:driver:location:update', async (payload) => {
    // payload: { latitude, longitude, accuracy, timestamp, rideId, seq?, heading?, speed? }
    const user = socket.data.user;
    if (!user || !user.id) return;
    console.log('inride:driver:location:update', payload);

    // Validate
    if (
      !payload.rideId ||
      typeof payload.latitude !== 'number' ||
      typeof payload.longitude !== 'number'
    ) {
      console.log('error');

      return emitToUser(user.id, 'error', { code: 'INVALID_PAYLOAD' });
    }
    if (Math.abs(payload.latitude) > 90 || Math.abs(payload.longitude) > 180) return;

    const serverTs = Date.now();
    const point = {
      driverId: user.id,
      rideId: payload.rideId,
      lat: payload.latitude,
      lng: payload.longitude,
      accuracy: payload.accuracy || null,
      deviceTs: payload.timestamp || null,
      serverTs,
      seq: payload.seq ?? null,
      heading: payload.heading ?? null,
      speed: payload.speed ?? null,
    };

    const redis = getRedisService();
    redis.updateDriverGeo(user.id, {
      latitude: payload.latitude,
      longitude: payload.longitude,
    });

    const small = {
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

    const existing = await redis.getHeartbeat(point.driverId, true);
    const heartbeatPayload = existing && existing.raw !== '1' ? existing : {};
    heartbeatPayload.driverLocation = {
      latitude: point.lat,
      longitude: point.lng,
      deviceTs: point.deviceTs,
      serverTs: point.serverTs,
    };
    await redis.setHeartbeat(point.driverId, 120, true, heartbeatPayload);

    emitToUser(small.driverId, 'driver:location:update', small);
    emitToUser(payload.userId, 'driver:location:update', small);
  });

  socket.on('ride:response', (response) => {
    const rideId = response.rideId;
    const driverId = socket.data.user.id;
    const action = response.action;

    RideMatchingService.getInstance().handleDriverResponse(
      rideId,
      driverId,
      action,
      response.rideData
    );
  });
}
