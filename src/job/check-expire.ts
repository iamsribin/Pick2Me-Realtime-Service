import { HEARTBEAT_PREFIX, IN_RIDE_HEARTBEAT_PREFIX } from '@Pick2Me/shared/constants';
import { getRedisService } from '@Pick2Me/shared/redis';

export async function listenForExpiredKeys() {
  const redisService = getRedisService();
  const redis = redisService.raw();

  const subscriber = redis.duplicate();

  // await subscriber.connect();
  console.log('callle');

  await subscriber.subscribe('__keyevent@0__:expired');

  subscriber.on('message', async (_, key) => {
    console.log('message on expire key',key);
    
    if (key.startsWith(IN_RIDE_HEARTBEAT_PREFIX)) {
      const userId = key.split(':')[2];
      const driver = redisService.getOnlineDriverDetails(userId);
      console.log(`Redis TTL expired → user ${userId} marked offline`);

    }
  });
}
