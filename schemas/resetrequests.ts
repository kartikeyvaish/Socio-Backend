// Packages imports
import mongoose from "mongoose";

// types imports
import { ResetRequestSchemaInterface } from "../types/SchemaTypes";

// time limit for an ResetRequest
const OTP_TIME_LIMIT = 600; // 10 minutes in seconds

// ResetRequest Schema
const ResetRequestSchema = new mongoose.Schema<ResetRequestSchemaInterface>({
    created_at: {
        type: Date,
        default: Date.now,
        required: true,
        expires: OTP_TIME_LIMIT,
    },
});

// exports
export default ResetRequestSchema;
