import express from 'express';
import { container } from '@/config/inversify.config';
import { verifyGatewayJwt } from '@pick2me/shared/auth';
import { TYPES } from '@/types/inversify-types';
import { catchAsync } from '@pick2me/shared/utils';
import { AdminController } from '@/controller/admin-controller';

const controller = container.get<AdminController>(TYPES.AdminController);

const router = express.Router();

// All routes require gateway JWT
router.use(verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

router.post('/push/subscribe', catchAsync(controller.saveSubscriptionForAdmin.bind(controller)));
router.get('/issues/unread-count', catchAsync(controller.getUnreadIssuesCount.bind(controller)));
router.get('/issues', catchAsync(controller.getIssuesList.bind(controller)));
router.patch('/issues/:id', catchAsync(controller.resolveIssue.bind(controller)));

export { router as adminRouter };
