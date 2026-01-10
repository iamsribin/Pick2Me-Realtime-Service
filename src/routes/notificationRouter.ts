import express from 'express';
import { container } from '@/config/inversify.config';
import { verifyGatewayJwt } from '@pick2me/shared/auth';
import { TYPES } from '@/types/inversify-types';
import { catchAsync } from '@pick2me/shared/utils';
import { NotificationController } from '@/controller/notification-controller';

const controller = container.get<NotificationController>(TYPES.NotificationController);

const router = express.Router();

// All routes require gateway JWT
router.use(verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

router.get('/me/notifications', catchAsync(controller.fetchNotifications.bind(controller)));
router.delete('/me/clear-all', catchAsync(controller.markAllAsRead.bind(controller)));
router.patch('/me/mark-all-read', catchAsync(controller.markAllAsRead.bind(controller)));
router.get('/me/unread-count', catchAsync(controller.unreadCount.bind(controller)));
router.patch('/me/:id/read', catchAsync(controller.markAsRead.bind(controller)));
router.delete('/me/:id', catchAsync(controller.deleteNotification.bind(controller)));





export { router as notificationRouter };
