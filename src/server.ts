import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import { isEnvDefined } from '@/utils/envChecker';
import { createRedisService } from '@Pick2Me/shared/redis';
import app from '@/server/http';
import { initSocket } from '@/server/socket';
import { RealTimeEventConsumer } from '@/events/consumer';
import { connectDB } from '@Pick2Me/shared/mongo';

const startServer = async () => {
  try {
    isEnvDefined();

    connectDB(process.env.MONGO_URL!);
     
    createRedisService(process.env.REDIS_URL!);

    const server = http.createServer(app);

    await RealTimeEventConsumer.init();
    initSocket(server);

    const PORT = process.env.PORT || 3002;

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