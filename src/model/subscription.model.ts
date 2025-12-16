import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionDoc extends Document {
  adminId: string; 
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscriptionDoc>({
  adminId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: () => new Date() },
});

SubscriptionSchema.index({ endpoint: 1 }, { unique: true }); 

export const SubscriptionModel = mongoose.model<ISubscriptionDoc>(
  'Subscription',
  SubscriptionSchema
);
