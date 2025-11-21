import { INotificationSchema } from "@/entities/INotification"
import { IMongoBaseRepository } from "@Pick2Me/shared/mongo"
import { UpdateWriteOpResult } from "mongoose"

export interface INotificationRepository extends IMongoBaseRepository<INotificationSchema> {
    updateAllNotifications(receiverId: string): Promise<UpdateWriteOpResult| null>
    getNotifications(receiverId: string, limit: number, skip: number): Promise<INotificationSchema[] | null>
}