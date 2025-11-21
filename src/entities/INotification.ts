import { Document, ObjectId, Schema } from "mongoose";

export interface INotificationSchema extends Document {
    _id:ObjectId
    receiverId: ObjectId;
    title: string,
    body:string,
    type: 'system'|'ride'|'payment';
    date: Date;
    createdAt: Date;
    isRead: boolean;
}