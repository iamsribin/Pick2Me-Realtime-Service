import { IIssue } from "@/entities/IIssue";
import { IAdminService } from "../interfaces/i-issue-service";
import { BadRequestError, InternalError } from "@Pick2Me/shared/errors";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/inversify-types";
import { IIssueRepository } from "@/repository/interfaces/i-issue-repo";
import webpush from 'web-push';
import { ISubscriptionDoc, SubscriptionModel } from "@/model/subscription.model";
import { PushSubPayload } from "@/types/notificartion-type";

@injectable()
export class AdminService implements IAdminService {
    constructor(@inject(TYPES.IssueRepository) private _issueRepository: IIssueRepository) { }
   
    async createIssue(issue: Partial<IIssue>): Promise<IIssue> {
        try {

            const res = await this._issueRepository.create(issue);
            if (!res) throw BadRequestError('Unable to create issue');
            return res;
        } catch (error) {
            throw InternalError('something went wrong while creating issue')
        }
    }

    async saveSubscriptionForAdmin(adminId: string, subscription: PushSubPayload) {
        await SubscriptionModel.updateOne(
            { endpoint: subscription.endpoint },
            {
                $set: {
                    adminId,
                    endpoint: subscription.endpoint,
                    keys: subscription.keys,
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        ).exec();
    }

    async getAllAdminSubscriptions(): Promise<ISubscriptionDoc[]> {
        return SubscriptionModel.find({}).exec();
    }

    async notifyAdmins(issue: IIssue) {
        const payload = JSON.stringify({ title: 'New Issue', body: `Issue id: ${issue._id}`, issueId: issue._id });

        // fetch subscriptions
        const subs = await this.getAllAdminSubscriptions();

        const sendPromises = subs.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.keys.p256dh,
                    auth: sub.keys.auth,
                },
            };

            try {
                await webpush.sendNotification(pushSubscription as any, payload);
            } catch (err: any) {
                const status = err?.statusCode ?? err?.status;
                console.warn('Failed to send push to', sub.endpoint, 'status=', status, err?.message || err);
                if (status === 410 || status === 404) {
                    try {
                        await SubscriptionModel.deleteOne({ endpoint: sub.endpoint }).exec();
                        console.log('Removed stale subscription', sub.endpoint);
                    } catch (deleteErr) {
                        console.warn('Failed to remove stale subscription', deleteErr);
                    }
                }
            }
        });

        await Promise.allSettled(sendPromises);
    }
}