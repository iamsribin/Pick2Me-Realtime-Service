// src/controllers/notification.controller.ts
import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/types/inversify-types";
import { NotificationService } from "@/services/implementation/notification-service";

interface GatewayUser { id: string; role?: string; }

@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.NotificationService) private notificationService: NotificationService
  ) {}

  // GET /me/notifications
  async fetchNotifications(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const notifications = await this.notificationService.getUserNotifications(user.id);
    return res.json({ success: true, data: notifications });
  }

  // GET /me/notifications/:id
  async fetchNotification(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const id = req.params.id;
    const notification = await this.notificationService.getNotificationById(user.id, id);
    return res.json({ success: true, data: notification });
  }

  // POST /me/notifications/:id/read
  async markAsRead(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const id = req.params.id;
    await this.notificationService.markAsRead(user.id, id);
    return res.json({ success: true, message: "Marked as read" });
  }

  // PUT /me/notifications/mark-all-read
  async markAllAsRead(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    await this.notificationService.markAllAsRead(user.id);
    return res.json({ success: true, message: "All notifications marked as read" });
  }

  // GET /me/notifications/unread-count
  async unreadCount(req: Request, res: Response) {
    const user = (req as any).gatewayUser as GatewayUser;
    const count = await this.notificationService.countUnread(user.id);
    return res.json({ success: true, data: { unread: count } });
  }
}
