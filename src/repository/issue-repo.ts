import { IIssue } from "@/entities/IIssue";
import { MongoBaseRepository } from "@Pick2Me/shared/mongo";
import { inject, injectable } from "inversify";
import { Model } from "mongoose";
import { IIssueRepository } from "./interfaces/i-issue-repo";
import { TYPES } from "@/types/inversify-types";

@injectable()
export class IssueRepository
    extends MongoBaseRepository<IIssue>
    implements IIssueRepository {

    constructor(@inject(TYPES.IssueModel) private model: Model<IIssue>) {
        super(model);
    }

}