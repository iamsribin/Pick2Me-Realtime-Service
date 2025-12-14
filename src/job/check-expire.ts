import { container } from '@/config/inversify.config';
import { IIssueService } from '@/services/interfaces/i-issue-service';
import { TYPES } from '@/types/inversify-types';
import { emitToUser } from '@/utils/socket-emit';
import { IN_RIDE_HEARTBEAT_PREFIX, IN_RIDE_HEARTBEAT_PREFIX_DATA } from '@Pick2Me/shared/constants';
import { getRedisService } from '@Pick2Me/shared/redis';

export async function listenForExpiredKeys() {
  const redisService = getRedisService();
  const redis = redisService.raw();

  const subscriber = redis.duplicate();

  await subscriber.subscribe('__keyevent@0__:expired');

  subscriber.on('message', async (_, key) => {
    console.log('message on expire key', key);

    if (key.startsWith(IN_RIDE_HEARTBEAT_PREFIX)) {

      const driverId = key.split(':')[2];
      const payloadKey = `${IN_RIDE_HEARTBEAT_PREFIX_DATA}${driverId}`;
      const raw = await redisService.raw().get(payloadKey);
      let payload = null;

      if (raw) {
        try {
          payload = JSON.parse(raw);
          const issueService = container.get<IIssueService>(TYPES.IssueService);
          const issue = await issueService.createIssue(payload);
          emitToUser("admin", 'issue:created', issue);
          
        } catch (err) {
          console.warn('failed to parse payload', err);
        }
      }


      console.log(`Redis TTL expired → user ${driverId} marked offline`);
    }
  });
}
