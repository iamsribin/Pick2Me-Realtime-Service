import { Schema, model } from "mongoose";

const issueSchema = new Schema(
    {
        rideId: {
            type: String,
            required: true,
        },
       
    },
    {
        timestamps: true,
    }
);

const Issue = model("Issues", iss);
export default Issue;