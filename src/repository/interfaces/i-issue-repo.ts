import { IIssue } from "@/entities/IIssue";
import { IMongoBaseRepository } from "@Pick2Me/shared/mongo";

export type IIssueRepository = IMongoBaseRepository<IIssue> 
