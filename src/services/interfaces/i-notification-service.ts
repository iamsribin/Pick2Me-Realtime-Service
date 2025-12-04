import { INotificationDto } from "@/dto/INotification.Dto";
import { INotificationSchema } from "@/entities/INotification";
import { expiresDocument } from "@/types/event-types";

export interface INotificationService {
  getUserNotifications(receiverId: string): Promise<INotificationDto[]>;
  getNotificationById(receiverId: string, notificationId: string): Promise<INotificationDto | null>;

  createNotification(notification: Partial<INotificationSchema>): Promise<INotificationDto>;
  createDocumentExpireNotification(documentData: expiresDocument): Promise<INotificationDto>;

  markAsReadForUser(receiverId: string, notificationId: string): Promise<void>;
  markAllAsRead(receiverId: string): Promise<void>;

  deleteNotificationForUser(receiverId: string, notificationId: string): Promise<void>;
  deleteAllNotificationsForUser(receiverId: string): Promise<void>;

  countUnread(receiverId: string): Promise<number>;
}
