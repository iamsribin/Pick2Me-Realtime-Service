import { emitToUser } from "@/utils/socket-emit";

class SocketService {
    notifyUser(notificationPayload:{id:string,data:any}){
        console.log("notificationPayload",notificationPayload);
        
     emitToUser(notificationPayload.id,"notification",notificationPayload.data)
    }
}

export const socketService = new SocketService()