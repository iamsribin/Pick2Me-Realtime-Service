import { emitToUser } from "@/utils/socket-emit";
import { Socket } from "socket.io";

export function attach(socket: Socket) {
  socket.on("send:message", (data) => {
    console.log("Received message:", data);
    emitToUser(data.receiver, "send:message", data);
  });

  socket.on("send:image", (data) => {
    emitToUser(data.receiver, "send:image", data);
  });

  socket.on("chat:typing", (data: { receiver: string; isTyping: boolean }) => {
    emitToUser(data.receiver, "chat:typing", { isTyping: data.isTyping });
  });

  socket.on("chat:edit", (data: { receiver: string; messageId: string; newText: string }) => {
    emitToUser(data.receiver, "chat:edit", data);
  });

  socket.on("chat:delete", (data: { receiver: string; messageId: string }) => {
    emitToUser(data.receiver, "chat:delete", data);
  });

  socket.on("call:start", (data: { receiver: string; offer: any }) => {
    console.log("Call started from", socket.id, "to", data.receiver);
    emitToUser(data.receiver, "call:incoming", {
      caller: socket.data.user.id,
      offer: data.offer
    });
  });

  socket.on("call:accept", (data: { receiver: string; answer: any }) => {
    console.log("Call accepted by", socket.data.user.id);
    emitToUser(data.receiver, "call:accepted", { answer: data.answer });
  });

  socket.on("call:ice-candidate", (data: { receiver: string; candidate: any }) => {
    emitToUser(data.receiver, "call:ice-candidate", { candidate: data.candidate });
  });

  socket.on("call:end", (data: { receiver: string }) => {
    emitToUser(data.receiver, "call:ended", {});
  });
}