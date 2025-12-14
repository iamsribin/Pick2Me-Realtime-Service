import { IIssue } from "@/entities/IIssue";
import { IIssueService } from "../interfaces/i-issue-service";
import { InternalError } from "@Pick2Me/shared/errors";

class IssueService implements IIssueService {
    createIssue(issue: Partial<IIssue>): Promise<IIssue> {
        try {

        } catch (error) {
            throw InternalError('something went wrong while creating issue')
        }
    }
}