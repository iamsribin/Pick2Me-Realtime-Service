import { INotificationDto } from '@/dto/INotification.Dto';
import { INotificationSchema } from '@/entities/INotification';
import { INotificationRepository } from '@/repository/interfaces/i-notification-repo';
import { BadRequestError } from '@Pick2Me/shared/errors';
import { INotificationService } from '../interfaces/i-notification-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { expiresDocument } from '@/types/event-types';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TYPES.NotificationRepository) private _notificationRepository: INotificationRepository
  ) {}

  // async getNotifications(
  //     receiverId: string,
  //     limit: number,
  //     skip: number
  // ): Promise<INotificationDto[]> {
  //     try {
  //         const notifications = await this.notificationRepository.getNotifications(
  //             receiverId as string,
  //             limit,
  //             skip
  //         );

  //         if (!notifications || notifications.length === 0) {
  //             return [];
  //         }

  //         let userIds: string[] = [];

  //         for (let i = 0; i < notifications.length; i++) {
  //             userIds.push(notifications[i].senderId as unknown as string);
  //         }

  //         // Map data to return type
  //         const notificationsDto: INotificationDto[] = {

  //         }

  //         return notificationsDto;
  //     } catch (err: unknown) {
  //         throw err;
  //     }
  // }x

  async createDocumentExpireNotification(documentData: expiresDocument): Promise<INotificationDto> {
    try {
    const documentTypes = documentData.documents
      .map(d => d.documentType)
      .filter(Boolean)          
      .join(', ');  

      const documentExpiryQuery = {
        receiverId: documentData.receiverId,
        title: `your ${documentData.documents.length} document expires`,
        body: `your ${documentTypes} expires update that before going to online`,
        date: documentData.generatedAt,
      };

      const response = await this._notificationRepository.create(documentExpiryQuery);

      if (!response)
        throw BadRequestError('something went wrong when creating document expire notification');
      
      const notification: INotificationDto = {
        body: response.body,
        date: response.date.toISOString(),
        id: response._id.toString(),
        receiverId: response.receiverId.toString(),
        title: response.title,
        type: response.type,
      };

      return notification;
    } catch (error) {
      console.log(error);
      
      throw error;
    }
  }

  async createNotification(notification: Partial<INotificationSchema>): Promise<INotificationDto> {
    try {
      console.log('notification', notification);

      const newNotification = await this._notificationRepository.create(notification);

      if (!newNotification) throw BadRequestError('An unexpected error occurred!');

      const notificationDto: INotificationDto = {
        id: newNotification._id as unknown as string,
        receiverId: newNotification.receiverId as unknown as string,
        body: newNotification.body,
        type: newNotification.type,
        title: newNotification.title,
        date: newNotification.date.toISOString(),
        read:newNotification.isRead,
      };

      return notificationDto;
    } catch (err: unknown) {
      throw err;
    }
  }

  async updateNotification(notificationId: string): Promise<void> {
    try {
      const updatedNotification = await this._notificationRepository.update(notificationId, {
        $set: { isRead: true },
      });

      if (!updatedNotification) throw BadRequestError('Failed to mark notification as read!');
    } catch (err: unknown) {
      throw err;
    }
  }

  async updateAllNotifications(receiverId: string): Promise<void> {
    try {
      const result = await this._notificationRepository.updateAllNotifications(receiverId);

      if (!result) throw new Error('Failed to mark notifications as read!');
    } catch (err: unknown) {
      throw err;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const result = await this._notificationRepository.delete(notificationId);

      if (!result) throw BadRequestError('Failed to delete notification!');
    } catch (err: unknown) {
      throw err;
    }
  }
}
