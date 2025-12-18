import { INotificationDto } from '@/dto/INotification.Dto';
import { INotificationSchema } from '@/entities/INotification';
import { INotificationRepository } from '@/repository/interfaces/i-notification-repo';
import { BadRequestError } from '@Pick2Me/shared/errors';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { expiresDocument } from '@/types/event-types';
import { INotificationService } from '../interfaces/i-notification-service';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TYPES.NotificationRepository) private _notificationRepository: INotificationRepository
  ) {}

  async getUserNotifications(receiverId: string): Promise<INotificationDto[]> {
    const docs = await this._notificationRepository.find({ receiverId: receiverId });
    if (!docs || docs.length === 0) return [];

    return docs.map((d: any) => ({
      id: d._id.toString(),
      receiverId: d.receiverId?.toString(),
      body: d.body,
      title: d.title,
      type: d.type,
      date: (d.createdAt || d.date)?.toISOString(),
      read: !!d.isRead,
      meta: d.meta || undefined,
    }));
  }

  async getNotificationById(receiverId: string, notificationId: string): Promise<INotificationDto | null> {
    const doc = await this._notificationRepository.findById(notificationId);
    if (!doc) return null;
    if (String(doc.receiverId) !== String(receiverId)) throw BadRequestError('Not authorized');
    return {
      id: doc._id.toString(),
      receiverId: doc.receiverId?.toString(),
      body: doc.body,
      title: doc.title,
      type: doc.type,
      date: (doc.createdAt || doc.date)?.toISOString(),
      read: !!doc.isRead,
    };
  }

  async createDocumentExpireNotification(documentData: expiresDocument): Promise<INotificationDto> {
    const documentTypes = documentData.documents
      .map(d => d.documentType)
      .filter(Boolean)
      .join(', ');

    const payload: Partial<INotificationSchema> = {
      receiverId: documentData.receiverId,
      title: `${documentData.documents.length} document(s) expiring`,
      body: `${documentTypes} will expire soon. Please update them before going online.`,
      date: documentData.generatedAt,
      type: 'system',
    };

    const response = await this._notificationRepository.create(payload as any);
    if (!response) throw BadRequestError('something went wrong when creating document expire notification');

    return {
      body: response.body,
      date: response.date.toISOString(),
      id: response._id.toString(),
      receiverId: response.receiverId.toString(),
      title: response.title,
      type: response.type,
      read: !!response.isRead,
    };
  }

  async createNotification(notification: Partial<INotificationSchema>): Promise<INotificationDto> {
    const newNotification = await this._notificationRepository.create(notification as any);
    if (!newNotification) throw BadRequestError('An unexpected error occurred!');

    return {
      id: newNotification._id.toString(),
      receiverId: newNotification.receiverId?.toString(),
      body: newNotification.body,
      type: newNotification.type,
      title: newNotification.title,
      date: newNotification.createdAt.toISOString(),
      read: !!newNotification.isRead,
    };
  }

  async markAsReadForUser(receiverId: string, notificationId: string): Promise<void> {
    const doc = await this._notificationRepository.findById(notificationId);
    if (!doc) throw BadRequestError('Notification not found');
    if (String(doc.receiverId) !== String(receiverId)) throw BadRequestError('Not authorized');

    const updated = await this._notificationRepository.update(notificationId, { $set: { isRead: true } });
    if (!updated) throw BadRequestError('Failed to mark notification as read!');
  }

  async markAllAsRead(receiverId: string): Promise<void> {
    const result = await this._notificationRepository.updateAllNotifications(receiverId);
    if (!result) throw BadRequestError('Failed to mark notifications as read!');
  }

  async deleteNotificationForUser(receiverId: string, notificationId: string): Promise<void> {
    const doc = await this._notificationRepository.findById(notificationId);
    if (!doc) throw BadRequestError('Notification not found');
    if (String(doc.receiverId) !== String(receiverId)) throw BadRequestError('Not authorized');

    const deleted = await this._notificationRepository.delete(notificationId);
    if (!deleted) throw BadRequestError('Failed to delete notification!');
  }

  async deleteAllNotificationsForUser(receiverId: string): Promise<void> {

    const result = await (this._notificationRepository as any).deleteAllForReceiver(receiverId);
    if (!result) throw BadRequestError('Failed to delete notifications');
  }

  async countUnread(receiverId: string): Promise<number> {
    const count = await (this._notificationRepository as any).countUnread(receiverId);
    if (typeof count === 'number') return count;

    const docs = await this._notificationRepository.find({ receiverId: receiverId, isRead: false });
    return Array.isArray(docs) ? docs.length : 0;
  }
}
