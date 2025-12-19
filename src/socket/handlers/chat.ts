import { emitToUser } from "@/utils/socket-emit";
import { Socket } from "socket.io";

export function attach(socket: Socket) {
  // Existing message & image
  socket.on("send:message", (data) => {
    console.log("message:", data);
    emitToUser(data.receiver, "send:message", data);
  });

  socket.on("send:image", (data) => {
    console.log("image:", data);
    emitToUser(data.receiver, "send:image", data);
  });

  // Typing indicator
  socket.on("chat:typing", (data: { receiver: string; isTyping: boolean }) => {
    emitToUser(data.receiver, "chat:typing", { isTyping: data.isTyping });
  });

  // Edit message
  socket.on("chat:edit", (data: { receiver: string; messageId: string; newText: string }) => {
    emitToUser(data.receiver, "chat:edit", data);
  });

  // Delete message
  socket.on("chat:delete", (data: { receiver: string; messageId: string }) => {
    emitToUser(data.receiver, "chat:delete", data);
  });

  socket.on("hello", (data) => {
    console.log("hello reach", data);
  });
}