import { IIssue } from "@/entities/IIssue";
import { MongoBaseRepository } from "@Pick2Me/shared/mongo";
import { inject, injectable } from "inversify";
import { FilterQuery, Model } from "mongoose";
import { IIssueRepository } from "./interfaces/i-issue-repo";
import { TYPES } from "@/types/inversify-types";
import Issue from "@/model/issues.model";

@injectable()
export class IssueRepository
    extends MongoBaseRepository<IIssue>
    implements IIssueRepository {

    constructor(@inject(TYPES.IssueModel) private model: Model<IIssue>) {
        super(model);
    }
    async findIssuesByStatusWithPagination(
        status: "Pending" | "Resolved" | "Reissued",
        page: number,
        limit: number,
        search: string
    ): Promise<{
        issues: IIssue[];
        totalItems: number;
    }> {
        try {
            const query: FilterQuery<IIssue> = {
                status: status,
            };

            if (search) {
                const regex = new RegExp(search, 'i');
                query.$or = [{ name: regex }, { email: regex }, { mobile: { $regex: regex } }];
            }

            const skip = (page - 1) * limit;

            const [issues, totalItems] = await Promise.all([
                Issue.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                Issue.countDocuments(query),
            ]);

            return {
                issues,
                totalItems,
            };
        } catch (error) {
            console.error('Repo Error:', error);
            throw new Error('Failed to fetch drivers with pagination.');
        }
    }
}