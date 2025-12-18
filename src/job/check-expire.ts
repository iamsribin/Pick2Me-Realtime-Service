import { container } from '@/config/inversify.config';
import { IAdminService } from '@/services/interfaces/i-admin-service';
import { TYPES } from '@/types/inversify-types';
import { emitToRoom } from '@/utils/socket-emit';
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

      // const driverId = key.split(':')[2];
      const driverId = key.split(':')[3];
      console.log(driverId);
      // console.log(driverId2);

    const raw = await redisService.get(`${IN_RIDE_HEARTBEAT_PREFIX_DATA}${driverId}`);
    const payload = raw ? JSON.parse(raw) : null;
    console.log("payload", payload);

      if (payload) {
        try {
          const issueService = container.get<IAdminService>(TYPES.AdminService);
          const issue = await issueService.createIssue(payload);
          emitToRoom("admin", 'issue:created', issue);
          issueService.notifyAdmins(issue);
        } catch (err) {
          console.warn('failed to parse payload', err);
        }
      }


      console.log(`Redis TTL expired → driver ${driverId} created issue`);
    }
  });
}
