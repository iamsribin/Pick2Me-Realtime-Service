import { Socket } from 'socket.io';
import { attach as attachChat } from './handlers/chat';
import { attach as attachLocationTrack } from './handlers/tracking';
import { PresenceService } from '@/utils/socket-cache';

export async function onConnection(socket: Socket) {
  const user = socket.data.user;
  if (!user) return socket.disconnect(true);

  const userRoom = `user:${user.id}`;
  socket.join(userRoom);
  console.log(`User ${user.id} connected with socket ID ${socket.id}`);

  attachChat(socket);
  attachLocationTrack(socket);

  await PresenceService.addSocket(user.id, socket.id);

  socket.on('disconnect', async (reason) => {
    await PresenceService.removeSocket(user.id, socket.id);
  });
}
