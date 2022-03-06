// Packages imports 
import mongoose from "mongoose";

// types imports
import { FollowRequestsSchemaInterface } from "../types/SchemaTypes";

// Create FollowRequestsSchema
const FollowRequestsSchema = new mongoose.Schema<FollowRequestsSchemaInterface>({
    request_from: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    request_to: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    request_datetime: { type: Date, default: Date.now }
});

// Exports
export default FollowRequestsSchema;