import { HEARTBEAT_PREFIX } from '@Pick2Me/shared/constants';
import { getRedisService } from '@Pick2Me/shared/redis';

export async function listenForExpiredKeys() {
  const redisService = getRedisService();
  const redis = redisService.raw();

  const subscriber = redis.duplicate();

  await subscriber.connect();

  await subscriber.subscribe('__keyevent@0__:expired');

  subscriber.on('message', async (_, key) => {
    if (key.startsWith(HEARTBEAT_PREFIX)) {
      const userId = key.split(':')[2];
      const driver = redisService.getOnlineDriverDetails(userId);
      console.log(`Redis TTL expired → user ${userId} marked offline`);

      // TODO: Publish to RabbitMQ here
      // await rabbit.publish('driver.offline', { userId });
    }
  });
}
