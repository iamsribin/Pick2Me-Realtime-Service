import { LocationCoordinates } from "@Pick2Me/shared/interfaces";
import { ObjectId } from "mongoose";

interface documentsDetails {
  documentType: string;
  expiryDate: Date;
  daysLeft: number;
}

export interface expiresDocument {
  messageId: string;
  receiverId: string;
  documents: documentsDetails[];
  generatedAt: Date;
}

export interface ConsumerTypes {
  type: string;
  data: BookRideResponse | expiresDocument;
}

export interface UserInfo {
  userId: string;
  userName: string;
  userNumber: string;
  userProfile: string;
}

 export interface DriverInfo  {
    driverId: string;
    driverName: string;
    driverNumber: string;
    driverProfile: string;
  }

export interface BookRideResponse {
  id: string;
  user: UserInfo;
  pin: number;
  pickupCoordinates: LocationCoordinates;
  dropOffCoordinates: LocationCoordinates;
  vehicleModel: string;
  price: number;
  duration: string;
  distanceInfo: { distance: string; distanceInKm: number };

  driver?: DriverInfo;
  status: "Pending" | "Accepted" | "InRide" | "Completed" | "Cancelled";
  paymentStatus: "Pending" | "Failed" | "Completed" | "idle";
  paymentMode: "Cash" | "Wallet" | "Strip";
  rideId: string;
  date: Date;
}