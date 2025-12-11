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

// server/socket-handlers.ts (TypeScript-like pseudocode)
socket.on('inride:driver:location:update', async (payload) => {
  // payload: { latitude, longitude, accuracy, timestamp, rideId, seq?, heading?, speed? }
  const user = socket.data.user;
  if (!user || !user.id) return;
console.log('inride:driver:location:update',payload);

  // Validate
  if (!payload.rideId || typeof payload.latitude !== 'number' || typeof payload.longitude !== 'number') {
    console.log("error");
    
    return emitToUser(user.id, 'error', { code: 'INVALID_PAYLOAD' });
  }
  if (Math.abs(payload.latitude) > 90 || Math.abs(payload.longitude) > 180) return;

  // // Rate limit per-socket or per-driver (simple example)
  // if (!rateLimiter.allow(user.id)) {
  //   return; // drop silently or send throttle ack
  // }

  // Build canonical point
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

  // Persist to Redis (atomic-ish)
  // 1) GEOADD drivers_geo lon lat driverId (for general nearby search)
  // 2) RPUSH ride:positions:{rideId} JSON(point) && LTRIM 0 199
  const redis = getRedisService();
          redis.updateDriverGeo(user.id, {
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
  // await redis.geoAdd('drivers_geo', point.lng, point.lat, user.id);
  // await redis.rpush(`ride:positions:${payload.rideId}`, JSON.stringify(point));
  // await redis.ltrim(`ride:positions:${payload.rideId}`, -200, -1);

  // // Optionally update last pos hash with TTL
  // await redis.hset(`driver:last:${user.id}`, {
  //   lat: point.lat,
  //   lng: point.lng,
  //   ts: serverTs,
  // });
  // await redis.expire(`driver:last:${user.id}`, 300); // keep 5 minutes

  // Emit to room
  const room = `ride:${payload.rideId}`;
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
  // Use Socket.IO Redis adapter in multi-node env 
  // emitToRoom(room,'driver:location:update',small)
  emitToUser(small.driverId,'driver:location:update',small)
  emitToUser(payload.userId,'driver:location:update',small)
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
