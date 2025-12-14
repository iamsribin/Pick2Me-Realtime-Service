import { IIssue } from "@/entities/IIssue";

export interface IIssueService {
    createIssue(issue: Partial<IIssue>): Promise<IIssue>
}