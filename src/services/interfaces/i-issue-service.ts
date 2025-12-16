import { IIssue } from "@/entities/IIssue";

export interface IAdminService {
    createIssue(issue: Partial<IIssue>): Promise<IIssue>
}