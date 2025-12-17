import { IIssue } from "@/entities/IIssue";
import { Schema, model } from "mongoose";

const issueSchema = new Schema<IIssue>(
  {
    rideId: {
      type: String,
      required: true,
    },
    note: { type: String },
    status: { type: String, enum: ["Pending", "Resolved", "Reissued"], default: "Pending" },
    user: {
      userId: { type: String, required: true },
      userName: { type: String, required: true },
      userNumber: { type: String, required: true },
      userProfile: { type: String, required: true },
    },
    driver: {
      driverId: { type: String, required: true },
      driverName: { type: String, required: true },
      driverNumber: { type: String, required: true },
      driverProfile: { type: String, required: true },
    },
    pickupCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },

    dropOffCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const Issue = model<IIssue>("Issues", issueSchema);
export default Issue;