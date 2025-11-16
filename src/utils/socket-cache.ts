import { getRedisService } from '@Pick2Me/shared/redis';

const socketsKey = (userId: string) => `sockets:user:${userId}`;
const onlineKey = (userId: string) => `user:online:${userId}`;

export const PresenceService = {
  async addSocket(userId: string, socketId: string) {
    const redisService = getRedisService();

    const redis = redisService.raw();
    await redis.sadd(socketsKey(userId), socketId);
    await redis.set(onlineKey(userId), '1');
  },

  async removeSocket(userId: string, socketId: string) {
    const redisService = getRedisService();

    const redis = redisService.raw();
    await redis.srem(socketsKey(userId), socketId);
    const remaining = await redis.scard(socketsKey(userId));
    if (remaining === 0) {
      await redis.del(onlineKey(userId));
    }
    return remaining;
  },

  async getSockets(userId: string) {
    const redisService = getRedisService();

    const redis = redisService.raw();
    return redis.smembers(socketsKey(userId));
  },
};
