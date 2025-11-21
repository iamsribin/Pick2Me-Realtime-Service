import { INotificationSchema } from "@/entities/INotification";
import { MongoBaseRepository } from "@Pick2Me/shared/mongo";
import { Model, Types, UpdateWriteOpResult } from "mongoose";
import { INotificationRepository } from "./interfaces/i-notification-repo";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/inversify-types";

@injectable()
export class NotificationRepository
    extends MongoBaseRepository<INotificationSchema>
    implements INotificationRepository {

    constructor(@inject(TYPES.NotificationModel) private model: Model<INotificationSchema>) {
        super(model);
    }

    async updateAllNotifications(
        receiverId: string
    ): Promise<UpdateWriteOpResult | null> {
        try {
            return await this.model.updateMany(
                { receiverId, isRead: false },
                { $set: { isRead: true } }
            );
        } catch (err: unknown) {
            return null;
        }
    }

    async getNotifications(
        receiverId: string,
        limit?: number,
        skip?: number
    ): Promise<INotificationSchema[] | null> {
        try {
            const now = new Date();
            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(now.getDate() - 28);

            const pipeline: any[] = [
                {
                    $match: {
                        receiverId: new Types.ObjectId(receiverId),
                        createdAt: {
                            $gte: fourWeeksAgo,
                            $lte: now,
                        },
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
            ];

            if (typeof skip === "number" && skip > 0) {
                pipeline.push({ $skip: skip });
            }

            if (typeof limit === "number" && limit > 0) {
                pipeline.push({ $limit: limit });
            }

            return await this.model.aggregate(pipeline); 
        } catch (err: unknown) {
            return null;
        }
    }
}