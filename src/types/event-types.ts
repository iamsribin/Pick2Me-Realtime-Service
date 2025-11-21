import { ObjectId } from "mongoose";

interface documentsDetails {
  documentType: string;
  expiryDate: Date;
  daysLeft: number;
}

export interface expiresDocument {
  messageId: string;
  receiverId: ObjectId;
  documents: documentsDetails[];
  generatedAt: Date;
}

export interface expiresDocumentConsumer {
  type: string;
  data: expiresDocument;
}
