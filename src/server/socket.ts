import { createAdapter } from '@socket.io/redis-adapter';
import { Server as SocketIOServer} from "socket.io";
import { Server as HttpServer } from 'http';
import { authenticateSocket } from '@/middleware/authenticate-socket';
import { onConnection } from '@/socket/connection';
import { getRedisService } from '@pick2me/shared/redis';

let io: SocketIOServer;

export const initSocket = async (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const redisService = await getRedisService();

  const pubClient = redisService.raw()
  const subClient = pubClient.duplicate();


  io.adapter(createAdapter(pubClient, subClient));

  io.use(authenticateSocket);
  io.on('connection', onConnection);
  return io;
}

export function getIo() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
