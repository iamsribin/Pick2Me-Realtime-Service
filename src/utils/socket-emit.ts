import { getIo } from '../server/socket';

export const emitToUser = (userId: string, event: string, payload: any) => {
  const room = `user:${userId}`;
  getIo().to(room).emit(event, payload);
};

export const emitToUsers = (userIds: string[], event: string, payload: any) => {
  const io = getIo();
  userIds.forEach(id => io.to(`user:${id}`).emit(event, payload));
};

export const emitToRoom = (room: string, event: string, payload: any) => {
  getIo().to(room).emit(event, payload);
};

