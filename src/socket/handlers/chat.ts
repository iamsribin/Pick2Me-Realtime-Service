import { Socket } from "socket.io"

export function attach(socket: Socket) {
  socket.on('chat:message', data => {
    console.log('message:', data)
  })

  socket.on('chat:typing', data => {
    console.log('typing:', data)
  })
}