import { Socket } from "socket.io"

export function attach(socket: Socket) {
  socket.on('chat:message', data => {
    console.log('message:', data)
  })

  socket.on('chat:typing', data => {
    console.log('typing:', data)
  })

  socket.on('hello',data=>{
    console.log("hello reach",data);
    
    // socketService.notifyUser({id:"68933743b49a8cf584ff3ef5",data:"notification"})
  })
}