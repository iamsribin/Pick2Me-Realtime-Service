// src/routes/notification.route.ts
import express from 'express';
import { container } from '@/config/inversify.config';
import { verifyGatewayJwt } from '@Pick2Me/shared/auth';
import { TYPES } from '@/types/inversify-types';
import { catchAsync } from '@Pick2Me/shared/utils';
import { NotificationController } from '@/controller/notification-controller';

const controller = container.get<NotificationController>(TYPES.NotificationController);

const router = express.Router();

// All routes require gateway JWT
router.use(verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

// list notifications
router.get('/me/notifications', catchAsync(controller.fetchNotifications.bind(controller)));

// get single notification
router.delete('/me/:id', catchAsync(controller.deleteNotification.bind(controller)));

// mark one as read
router.patch('/me/:id/read', catchAsync(controller.markAsRead.bind(controller)));

// mark all as read
router.patch('/me/mark-all-read', catchAsync(controller.markAllAsRead.bind(controller)));

router.delete('/me/clear-all', catchAsync(controller.markAllAsRead.bind(controller)));

// unread count
router.get('/me/unread-count', catchAsync(controller.unreadCount.bind(controller)));

export { router as notificationRouter };
