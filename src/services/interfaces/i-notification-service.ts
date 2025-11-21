import { INotificationDto } from "@/dto/INotification.Dto";
import { INotificationSchema } from "../../entities/INotification";
import { expiresDocument } from "@/types/event-types";

export interface INotificationService {
    // getNotifications(receiverId: string, limit: number, skip: number): Promise<INotificationDto[]>;
    createNotification(notification: Partial<INotificationSchema>): Promise<INotificationDto>;
    createDocumentExpireNotification(documentData: expiresDocument): Promise<INotificationDto>;
    updateNotification(notificationId: string): Promise<void>;
    updateAllNotifications(receiverId: string): Promise<void>;
    deleteNotification(notificationId: string): Promise<void>;
}