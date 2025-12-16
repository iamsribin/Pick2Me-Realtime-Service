import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IAdminService } from '@/services/interfaces/i-issue-service';
import { BadRequestError } from '@Pick2Me/shared/errors';

@injectable()
export class AdminController {
  constructor(@inject(TYPES.AdminService) private adminService: IAdminService) {}

  async saveSubscriptionForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = req.body;
      const user = (req as any).gatewayUser; 
      if (!user?.id) return res.status(401).json({ message: 'Unauthorized' });

      if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        throw BadRequestError('Invalid subscription payload')
      }

      await this.adminService.saveSubscriptionForAdmin(user.id, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

      return res.status(201).json({ message: 'subscription saved' });
    } catch (err) {
      next(err);
    }
  }
}
