// Packages imports
import mongoose from "mongoose";

// types imports
import { OTPSchemaInterface } from "../types/SchemaTypes";

// time limit for an OTP
const OTP_TIME_LIMIT = 600; // 10 minutes

// Types of verification
export const VERIFICATION_TYPES = {
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
};

// Generate an Array for the verification types
const VERIFICATION_TYPES_ENUMS = Object.keys(VERIFICATION_TYPES).map(
    (key) => VERIFICATION_TYPES[key]
);

// OTP Schema Schema
const OTPSchema = new mongoose.Schema<OTPSchemaInterface>({
    verification_type: {
        type: String,
        enum: VERIFICATION_TYPES_ENUMS,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
        required: true,
        expires: OTP_TIME_LIMIT,
    },
    otp: {
        type: String,
        required: true,
    },
});

// exports
export default OTPSchema;
