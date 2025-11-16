import { Socket } from "socket.io"

export function attach(socket: Socket) {
  socket.on('ride:location', data => {
    console.log('location:', data)
  })

  socket.on('ride:start', data => {
    console.log('ride started')
  })
}
