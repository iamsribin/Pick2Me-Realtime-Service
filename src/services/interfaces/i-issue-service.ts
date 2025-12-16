import { IIssue } from "@/entities/IIssue";
import { PushSubPayload } from "@/types/notificartion-type";

export interface IAdminService {
    createIssue(issue: Partial<IIssue>): Promise<IIssue>
    notifyAdmins(issue:IIssue): Promise<void>
    saveSubscriptionForAdmin(adminId: string, subscription: PushSubPayload) : Promise<void>
}