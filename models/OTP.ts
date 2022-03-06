// Packages imports
import mongoose from "mongoose";

// Local imports  
import OTPSchema from "../schemas/OTP";
import { OTPSchemaInterface } from "../types/SchemaTypes";

// OTP Model
const OTP = mongoose.model<OTPSchemaInterface>("otp", OTPSchema);

// Exporting the OTP model
export default OTP;