import { IIssue } from "@/entities/IIssue";
import { IAdminService } from "../interfaces/i-admin-service";
import { BadRequestError, ConflictError, HttpError, InternalError } from "@pick2me/shared/errors";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/inversify-types";
import { IIssueRepository } from "@/repository/interfaces/i-issue-repo";
import webpush from 'web-push';
import { ISubscriptionDoc, SubscriptionModel } from "@/model/subscription.model";
import { PushSubPayload } from "@/types/notification-type";
import { RedisService } from "@pick2me/shared/redis";

@injectable()
export class AdminService implements IAdminService {
    constructor(@inject(TYPES.IssueRepository) private _issueRepository: IIssueRepository) { }

    async createIssue(issue: Partial<IIssue>): Promise<IIssue> {
        try {
            const issueExists = await this._issueRepository.findOne({ rideId: issue.rideId });

            if (issueExists && issueExists.status === "Pending") {
                throw ConflictError('Issue already reported for this ride')
            } else if (issueExists && issueExists.status === "Resolved") {
                const issue = await this._issueRepository.updateOne({ rideId: issueExists.rideId }, { status: "Reissued" })
                if (!issue) throw BadRequestError('unable to recreate issue');
                return issue
            } else if (issueExists) {
                throw ConflictError('Issue already reported for this ride')
            }

            const res = await this._issueRepository.create(issue);
            if (!res) throw BadRequestError('Unable to create issue');
            return res;
        } catch (error) {
            console.log(error);

            throw InternalError('something went wrong while creating issue')
        }
    }

    async getUnreadIssuesCount(): Promise<number> {
        try {
            const issues = await this._issueRepository.find({ status: "Pending" });

            return issues?.length || 0;
        } catch (error) {
            throw InternalError('something went wrong while fetching unread issues count')
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

    async getIssuesList(paginationQuery: {
        status: "Pending" | "Resolved" | "Reissued";
        page: number;
        limit: number;
        search: string;
    }): Promise<any> {
        try {
            const validatedPage = Math.max(1, paginationQuery.page);
            const validatedLimit = Math.min(50, Math.max(1, paginationQuery.limit));
            const trimmedSearch = paginationQuery.search.trim();

            const { issues, totalItems } = await this._issueRepository.findIssuesByStatusWithPagination(
                paginationQuery.status,
                validatedPage,
                validatedLimit,
                trimmedSearch
            );

            if (!issues.length) {
                return {
                    issues: [],
                    pagination: {
                        currentPage: validatedPage,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: validatedLimit,
                        hasNextPage: false,
                        hasPreviousPage: false,
                    },
                };
            }

            const result = await Promise.all(
                issues.map(async (issue) => ({
                    id: issue._id.toString(),
                    user: issue.user,
                    rideId: issue.rideId,
                    note: issue.note,
                    status: issue.status,
                    driver: issue.driver,
                    pickupCoordinates: issue.pickupCoordinates,
                    dropOffCoordinates: issue.dropOffCoordinates,
                    createdAt: issue.createdAt,
                    currentLocation: issue.driver?.driverId
                        ? await RedisService.getInstance().getDriverGeoPosition(issue.driver.driverId)
                        : null,
                }))
            );


            const totalPages = Math.ceil(totalItems / validatedLimit);

            return {
                issues: result,
                pagination: {
                    currentPage: validatedPage,
                    totalPages,
                    totalItems,
                    itemsPerPage: validatedLimit,
                    hasNextPage: validatedPage < totalPages,
                    hasPreviousPage: validatedPage > 1,
                },
            };
        } catch (error: unknown) {
            if (error instanceof HttpError) throw error;
            throw InternalError('something went wrong', {
                details: { cause: error instanceof Error ? error.message : String(error) },
            });
        }
    }

    async resolveIssue(issueId: string, note: string): Promise<void> {
        try {
            const issue = await this._issueRepository.update(issueId, { status: 'Resolved', note })
        } catch (error) {
            if (error instanceof HttpError) throw error;
            throw InternalError('something went wrong');
        }
    }
}
