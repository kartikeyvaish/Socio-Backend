// package and other modules 
import express from "express";

// static imports  
import { OTPVerifyValidate } from "../middlewares/OTPValidators";
import { VerifyEmailSignUpOTP, VerifyResetPasswordOTP } from "../controllers/OTP";

// Initialize router
const router = express.Router();

const OTPRoutes = router;

// Verify Email Signup OTP
router.post("/verify-email-signup-otp", OTPVerifyValidate, VerifyEmailSignUpOTP);

// Verify Email OTP Reset Password
router.post("/verify-reset-password-otp", OTPVerifyValidate, VerifyResetPasswordOTP);

// export router
export default OTPRoutes;
