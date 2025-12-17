import { IIssue } from "@/entities/IIssue";
import { IMongoBaseRepository } from "@Pick2Me/shared/mongo";

export interface IIssueRepository extends IMongoBaseRepository < IIssue > {
    findIssuesByStatusWithPagination(
        status:  "Pending" | "Resolved" | "Reissued",
        page: number,
        limit: number,
        search: string
    ): Promise<{
        issues: IIssue[];
        totalItems: number;
    }>
}
