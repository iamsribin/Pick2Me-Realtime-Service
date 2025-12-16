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
import { NotificationController } from "@/controller/notification-controller";
import { IIssue } from "@/entities/IIssue";
import Issue from "@/model/issues.model";
import { IIssueRepository } from "@/repository/interfaces/i-issue-repo";
import { IssueRepository } from "@/repository/issue-repo";
import { IAdminService } from "@/services/interfaces/i-issue-service";
import { AdminService } from "@/services/implementation/admin-service";

const container = new Container();

container.bind<NotificationController>(TYPES.NotificationController).to(NotificationController);

container.bind<INotificationService>(TYPES.NotificationService).to(NotificationService);
container.bind<IAdminService>(TYPES.AdminService).to(AdminService);

container.bind<INotificationRepository>(TYPES.NotificationRepository).to(NotificationRepository);
container.bind<IIssueRepository>(TYPES.IssueRepository).to(IssueRepository);

container
  .bind<Model<IIssue>>(TYPES.IssueModel)
  .toConstantValue(Issue);

container
  .bind<Model<INotificationSchema>>(TYPES.NotificationModel)
  .toConstantValue(Notification);

export { container };
