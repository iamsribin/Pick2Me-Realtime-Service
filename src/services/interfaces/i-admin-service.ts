import { IIssue } from "@/entities/IIssue";
import { PushSubPayload } from "@/types/notification-type";

export interface IAdminService {
    createIssue(issue: Partial<IIssue>): Promise<IIssue>
    notifyAdmins(issue: IIssue): Promise<void>
    getUnreadIssuesCount(): Promise<number>
    saveSubscriptionForAdmin(adminId: string, subscription: PushSubPayload): Promise<void>
    getIssuesList(data: {
        status: 'Pending' | 'Resolved' | 'Reissued';
        page: number;
        limit: number;
        search: string;
    }): Promise<any>;
}