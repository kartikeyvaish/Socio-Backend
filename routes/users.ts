// package and other modules 
import express from "express";

// static imports  
import { CheckOTPSendAuth, OTPSignUpValidate, ResetPasswordValidate } from "../middlewares/OTPValidators";
import { changePassword, editProfile, googleLogin, login, logout, refreshToken, resetPassword, sendEmailSignUpOTP, sendResetPasswordOTP, signUp, toggleProfilePrivacy, togglePushNotifications } from "../controllers/users";
import { ChangePasswordValidate, EditProfileValidate, GoogleSignInValidate, LoginValidate, RefreshTokenAuth, SignUpValidate, UserAuth } from "../middlewares/AuthValidator";
import Multer from "../utils/Multer";

// Initialize router
const router = express.Router();

// Send Email OTP for Signup
router.post("/send-email-signup-otp", CheckOTPSendAuth, OTPSignUpValidate, sendEmailSignUpOTP);

// SignUp
router.post("/signup", Multer.single("profile_picture"), SignUpValidate, signUp);

// Login
router.post("/login", LoginValidate, login);

// Google Login
router.post("/google-login", GoogleSignInValidate, googleLogin);

// Logout endpoint
router.delete("/logout", UserAuth, logout);

// Change Password
router.put("/change-password", UserAuth, ChangePasswordValidate, changePassword);

// Edit Profile
router.put("/edit-profile", Multer.single("profile_picture"), UserAuth, EditProfileValidate, editProfile);

// Send Forgot Password OTP
router.post("/send-reset-password-otp", CheckOTPSendAuth, OTPSignUpValidate, sendResetPasswordOTP);

// Reset Password
router.put("/reset-password", ResetPasswordValidate, resetPassword);

// Toggle Push Notification
router.put("/toggle-push-notification", UserAuth, togglePushNotifications);

// Toggle Profile Private
router.put("/toggle-profile-private", UserAuth, toggleProfilePrivacy);

// Refresh Token
router.post("/refresh-token", RefreshTokenAuth, refreshToken);

const UserRoutes = router;

// export router
export default UserRoutes;
