import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IAdminService } from '@/services/interfaces/i-admin-service';
import { BadRequestError } from '@Pick2Me/shared/errors';
import { StatusCode } from '@Pick2Me/shared/interfaces';

@injectable()
export class AdminController {
    constructor(@inject(TYPES.AdminService) private _adminService: IAdminService) { }

    async saveSubscriptionForAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const subscription = req.body;
            const user = (req as any).gatewayUser;
            if (!user?.id) return res.status(401).json({ message: 'Unauthorized' });

            if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
                throw BadRequestError('Invalid subscription payload')
            }

            await this._adminService.saveSubscriptionForAdmin(user.id, {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            });

            return res.status(StatusCode.Created).json({ message: 'subscription saved' });
        } catch (err) {
            console.log(err);
            next(err);
        }
    }

    async getUnreadIssuesCount(req: Request, res: Response, next: NextFunction) {
        try {
            const count = await this._adminService.getUnreadIssuesCount();
            res.status(StatusCode.OK).json({ success: true, data: count })
        } catch (error) {
            next(error);
        }
    }

    async getIssuesList(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Number(req.query.limit) || 6);
            const status = req.query.status;

            const search = String(req.query.search || '');

            const data = {
                status: status as 'Pending' | 'Resolved' | 'Reissued',
                page: page as number,
                limit: limit as number,
                search: search.toString().trim(),
            };

            const result = await this._adminService.getIssuesList(data);

            res.status(StatusCode.OK).json({
                issues: result.issues || [],
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    async resolveIssue(req: Request, res: Response, next: NextFunction) {
        try {
            const issueId = req.params.id;
            const {note} = req.body
            console.log({issueId, note});
            
            if (!issueId) throw BadRequestError('issue id is required');
            await this._adminService.resolveIssue(issueId,note);
            res.status(StatusCode.OK).json({ message: 'Issue resolved successfully' })
        } catch (error) {
            next(error)
        }
    }
}
