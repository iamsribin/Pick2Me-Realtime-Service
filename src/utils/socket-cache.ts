import { SOCKET_PREFIX } from '@pick2me/shared/constants';
import { getRedisService } from '@pick2me/shared/redis';

const socketsKey = (userId: string) => `${SOCKET_PREFIX}${userId}`;

export const PresenceService = {
  async addSocket(userId: string, socketId: string) {
    const redisService = getRedisService();

    const redis = redisService.raw();
    await redis.sadd(socketsKey(userId), socketId);
  },

  async removeSocket(userId: string, socketId: string) {
    const redisService = getRedisService();

    const redis = redisService.raw();
    await redis.srem(socketsKey(userId), socketId);
  },

  async getSockets(userId: string) {
    const redisService = getRedisService();

    const redis = redisService.raw();
    return redis.smembers(socketsKey(userId));
  },
};
