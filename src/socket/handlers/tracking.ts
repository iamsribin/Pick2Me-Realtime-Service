import { emitToUser } from '@/utils/socket-emit';
import { Coordinates } from '@Pick2Me/shared/interfaces';
import { getRedisService } from '@Pick2Me/shared/redis';
import { Socket } from 'socket.io';

export function attach(socket: Socket) {
  socket.on('driver:heartbeat', (data: { timestamp: Date; location: Coordinates }) => {
    const redisService = getRedisService();
    redisService.setHeartbeat(socket.data.user.id);
  });

  socket.on(
    'driver:location:update',
    (data: { latitude: number; longitude: number; accuracy: number; timestamp: TimeRanges }) => {
      try {
        console.log('driver:location:update', data);
        const redisService = getRedisService();
        const user = socket.data.user;
        
        redisService.updateOnlineDriverGeo(user.id, {
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
}
