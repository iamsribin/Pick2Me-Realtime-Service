import "reflect-metadata"; 
import { Container } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { INotificationService } from '@/services/interfaces/i-notification-service';
import { NotificationService } from '@/services/implementation/notification-service';
import { INotificationRepository } from '@/repository/interfaces/i-notification-repo';
import { NotificationRepository } from '@/repository/notification-repo';
import { INotificationSchema } from '@/entities/INotification';
import Notification from '@/model/notification.modal';
import { Model } from "mongoose";

const container = new Container();

container.bind<INotificationService>(TYPES.NotificationService).to(NotificationService);
container.bind<INotificationRepository>(TYPES.NotificationRepository).to(NotificationRepository);
container
  .bind<Model<INotificationSchema>>(TYPES.NotificationModel)
  .toConstantValue(Notification);
export { container };
