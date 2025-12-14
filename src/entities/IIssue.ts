import { LocationCoordinates } from "@Pick2Me/shared/interfaces";
import { Document, ObjectId } from "mongoose";

export interface IIssue extends Document {
    _id: ObjectId
    rideId: string;
    note: string;
    user: {
        userId: string;
        userName: string;
        userNumber: string;
        userProfile: string;
    };
    driver: {
        driverId: string;
        driverName: string;
        driverNumber: string;
        driverProfile: string;
    };
    status: "Pending" | "Accepted";
    pickupCoordinates: LocationCoordinates;
    dropOffCoordinates: LocationCoordinates;
}