// Packages imports
import bcrypt from "bcrypt";

// Local Imports 
import OTP from "../models/OTP";
import { VERIFICATION_TYPES } from "../schemas/OTP";

// Create an OTP instance
export async function CreateOTP(verification_type: string) {
    try {
        // Check if the verification type is valid
        if (!Object.values(VERIFICATION_TYPES).includes(verification_type))
            return { ok: false };

        // Genereate OTP
        const OTP_Random = Math.floor(100000 + Math.random() * 900000)

        // Create new OTP instance
        const newOtp = new OTP({
            verification_type: VERIFICATION_TYPES[verification_type],
            otp: OTP_Random.toString(),
        });

        // Hash the otp
        const salt = await bcrypt.genSalt(10);
        newOtp.otp = await bcrypt.hash(newOtp.otp, salt);

        // Save the OTP instance
        await newOtp.save();

        return { otp_id: newOtp._id, otp: OTP_Random, ok: true };
    } catch (error) {
        return { ok: false };
    }
}
