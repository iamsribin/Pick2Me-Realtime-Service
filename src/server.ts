import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import { isEnvDefined } from '@/utils/envChecker';
import { createRedisService } from '@pick2me/shared/redis';
import app from '@/server/http';
import { initSocket } from '@/server/socket';
import { RealTimeEventConsumer } from '@/events/consumer';
import { connectDB } from '@pick2me/shared/mongo';
import { listenForExpiredKeys } from './job/check-expire';
import webpush from 'web-push';

const startServer = async () => {
  try {
    isEnvDefined();

    connectDB(process.env.MONGO_URL!);

    createRedisService(process.env.REDIS_URL!);

    webpush.setVapidDetails(
      'mailto:sribin85@gamil.com',
      process.env.VAPID_PUBLIC!,
      process.env.VAPID_PRIVATE!
    );
    
    const server = http.createServer(app);

    await RealTimeEventConsumer.init();
    initSocket(server);
    listenForExpiredKeys();
    const PORT = process.env.PORT;

    server.listen(PORT, () => {
      console.log(`Realtime service listening on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  } catch (err: any) {
    console.log(err.message);
  }
};

startServer();
