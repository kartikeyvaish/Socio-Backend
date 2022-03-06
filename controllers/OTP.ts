// packages imports
import bcrypt from "bcrypt";
import { Request, Response } from "express";

// Local imports  
import OTP from "../models/OTP";
import resetrequests from "../models/resetrequests";

// Verify Email Signup OTP
export async function VerifyEmailSignUpOTP(req: Request, res: Response) {
    try {
        let otpObject = await OTP.findById(req.body.otp_id);

        // if otpObject is not found
        if (!otpObject)
            return res.status(400).send({
                isVerified: false,
                message: "OTP has been expired or invalid OTP ID",
            });

        // If verification type is not matching
        if (otpObject.verification_type !== req.body.verification_type)
            return res.status(400).send({
                isVerified: false,
                message: "OTP Verification Type is Invalid",
            });

        // If OTP is not matching
        const check_otp = await bcrypt.compare(
            req.body.otp.toString(),
            otpObject.otp
        );
        if (!check_otp)
            return res.status(400).send({
                isVerified: false,
                message: "OTP is invalid",
            });

        // Delete the OTP
        await otpObject.delete();

        // response
        return res.status(200).send({
            isVerified: true,
            message: "OTP is correct and Email has been verified",
        });
    } catch (error) {
        return res.status(500).send({ message: "Error while sending OTP. Please try again later." });
    }
}

// Verify Email OTP Reset Password
export async function VerifyResetPasswordOTP(req: Request, res: Response) {
    try {
        let otpObject = await OTP.findById(req.body.otp_id);

        // if otpObject is not found
        if (!otpObject)
            return res.status(400).send({
                isVerified: false,
                message: "OTP has been expired or invalid OTP ID",
            });

        // If verification type is not matching
        if (otpObject.verification_type !== req.body.verification_type)
            return res.status(400).send({
                isVerified: false,
                message: "OTP Verification Type is Invalid",
            });

        // If OTP is not matching
        const check_otp = await bcrypt.compare(
            req.body.otp.toString(),
            otpObject.otp
        );
        if (!check_otp)
            return res.status(400).send({
                isVerified: false,
                message: "OTP is invalid",
            });


        // Create a ResetRequests Object
        const resetRequestsObj = new resetrequests();
        await resetRequestsObj.save();

        // Delete the OTP
        await otpObject.delete();

        // response
        return res.status(200).send({
            isVerified: true,
            message: "OTP is correct and Email has been verified",
            reset_request_id: resetRequestsObj._id,
        });
    } catch (error) {
        return res.status(500).send({ message: "Error while sending Reset OTP. Please try again later." });
    }
}