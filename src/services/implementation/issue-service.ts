import { IIssue } from "@/entities/IIssue";
import { IIssueService } from "../interfaces/i-issue-service";
import { BadRequestError, InternalError } from "@Pick2Me/shared/errors";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/inversify-types";
import { IIssueRepository } from "@/repository/interfaces/i-issue-repo";

@injectable()
export class IssueService implements IIssueService {
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
}