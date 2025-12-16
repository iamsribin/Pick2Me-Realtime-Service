import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/types/inversify-types";
import { INotificationService } from "@/services/interfaces/i-notification-service";

interface GatewayUser { id: string; role?: string; }

@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.NotificationService) private notificationService: INotificationService
  ) {}

  async fetchNotifications(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const notifications = await this.notificationService.getUserNotifications(user.id);
    return res.json({ success: true, data: notifications });
  }

  async deleteNotification(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const id = req.params.id;
    await this.notificationService.deleteNotificationForUser(user.id, id);
    return res.json({ success: true, message: "Notification deleted" });
  }

  async markAsRead(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const id = req.params.id;
    await this.notificationService.markAsReadForUser(user.id, id);
    return res.json({ success: true, message: "Marked as read" });
  }

  async markAllAsRead(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    await this.notificationService.markAllAsRead(user.id);
    return res.json({ success: true, message: "All notifications marked as read" });
  }

  async clearAll(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    await this.notificationService.deleteAllNotificationsForUser(user.id);
    return res.json({ success: true, message: "All notifications cleared" });
  }

  async unreadCount(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const count = await this.notificationService.countUnread(user.id);
    return res.json({ success: true, data: { unread: count } });
  }
}
