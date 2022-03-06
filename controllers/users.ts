// Pakcages Imports
import bcrypt from 'bcrypt';
import { Request, Response } from "express";

// Models imports
import followers from '../models/followers';
import following from '../models/following';
import resetrequests from '../models/resetrequests';
import users from "../models/users";

// Helpers/Utils/Types imports
import { CreateOTP } from "../helper/OTP";
import { get_encoded_data, get_login_payload_data, get_refresh_payload, uploadProfilePicture } from '../helper/Users';
import JWT from '../helper/JWT';
import messages from "../config/messages";
import { SendOTPEmail } from "../utils/Mailer";
import { VERIFICATION_TYPES } from "../schemas/OTP";
import { VerifyTokenID } from '../utils/GoogleAuth';

// function to send email OTP for signup
export async function sendEmailSignUpOTP(req: Request, res: Response) {
    try {
        // Check if Body consists of email
        if (!req.body.email) return res.status(400).send({ message: messages.emailMissing });

        // Check if email is already in use
        const user = await users.findOne({ email: req.body.email });
        if (user)
            return res.status(400).send({
                message: messages.associatedEmailAccount,
            });

        // Create new OTP instance
        const newOtp = await CreateOTP(VERIFICATION_TYPES.EMAIL_VERIFICATION);
        if (!newOtp.ok) return res.status(400).send({ message: "Error while sending OTP" });

        // Send Email
        const sendMail = await SendOTPEmail({
            to: req.body.email,
            subject: "Email Verification",
            locals: {
                OTP: newOtp.otp,
                operation: "to verify your email address.",
            },
        });

        // If email has been sent successfully
        if (sendMail.ok) {
            return res.send({
                message: "OTP has been sent to your email",
                otp_id: newOtp.otp_id,
            });
        }

        return res.status(400).send({
            message: "Error in sending OTP. Server Error",
        });
    } catch (error) {
        return res.status(500).send({
            message: "Error in sending OTP. Server Error",
        });
    }
}

// function to sign Up
export async function signUp(req: Request, res: Response) {
    try {
        // Check if account with same email already exists
        const user = await users.findOne({ email: req.body.email });
        if (user) return res.status(400).send({ message: messages.associatedEmailAccount });

        const newUser = new users(req.body);

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);

        // Destination for profile_picture
        const destination = `Socio/users/${newUser._id}/profile_picture`;
        let uploadResponse: any;
        let isPicPresent = req.body.profile_picture ? true : false;

        // If profile_picture is present in the request body
        // Upload the profile_picture
        if (isPicPresent) uploadResponse = await uploadProfilePicture(req.body.profile_picture, destination);

        // If response is ok, update profile_picture in the database
        if (isPicPresent) {
            if (uploadResponse?.secure_url?.length) newUser.profile_picture = uploadResponse.secure_url;
            else return res.status(400).send({ message: "Error while uploading profile picture", isLoggedIn: false });
        }

        // Create followers and following instances for the user
        const followersInstance = new followers({ follower_of: newUser._id });
        await followersInstance.save();
        const followingInstance = new following({ following_of: newUser._id });
        await followingInstance.save();

        // Save the user
        await newUser.save();

        // Create userData
        const newUserData = get_encoded_data(newUser);

        // Return response
        return res.status(200).send({
            user_token: newUserData,
            message: "Your account has been created successfully..",
            isLoggedIn: true,
        });
    } catch (error) {
        // Error response
        return res.status(500).send({ message: "Some error occured while signing up. Please try again later", isLoggedIn: false });
    }
}

// function to login
export async function login(req: Request, res: Response) {
    try {
        // check if user exists
        const user = await users.findOne().or([
            {
                email: req.body.email,
            },
            {
                username: req.body.email,
            },
        ]);

        if (!user) return res.status(404).send({ message: messages.accountMissing, isLoggedIn: false });

        // check if password is correct
        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordCorrect)
            return res.status(400).send({ message: messages.invalidCredentials, isLoggedIn: false });


        // If request body has push_notification_token, update it in the database
        if (req.body.push_notification_token) {
            user.push_notification_token = req.body.push_notification_token;
            await user.save();
        }

        // Create userData
        const newUserData = get_encoded_data(user);

        // Return response
        return res.status(200).send({
            user_token: newUserData,
            message: "Login Successfull",
            isLoggedIn: true,
        });
    } catch (error) {
        // Error Response
        return res.status(500).send({ message: "Some error occured while logging in. Please try again later", isLoggedIn: false });
    }
}

// function for googleLogin
export async function googleLogin(req: Request, res: Response) {
    try {
        const verifyResponse = await VerifyTokenID(req.body.id_token);

        if (!verifyResponse.ok) return res.status(400).send({ message: "Invalid ID Token", isLoggedIn: false });

        const user_details = verifyResponse.ticket.getPayload();

        const email = user_details?.email;

        if (!email) return res.status(400).send({ message: "Invalid Email", isLoggedIn: false });

        const user = await users.findOne({ email: email });

        if (!user)
            return res.status(200).send({
                message: messages.fillRestDetails,
                user_details: {
                    email: user_details.email,
                    name: user_details.name,
                    profile_picture: user_details.picture,
                },
                isLoggedIn: false,
                partial_login: true,
            });

        // If request body has push_notification_token, update it in the database
        if (req.body.push_notification_token) {
            user.push_notification_token = req.body.push_notification_token;
            await user.save();
        }

        const userData = get_encoded_data(user);

        // Response
        return res.status(200).send({
            user_token: userData,
            message: "Logged in successfully..",
            isLoggedIn: true,
        });
    } catch (error) {
        return res.status(500).send({ message: "Some error occured while logging in. Please try again later", isLoggedIn: false });
    }
}

// function for logout
export async function logout(req: Request, res: Response) {
    try {
        const user = await users.findOne({ _id: req.body.user_details._id });

        user.push_notification_token = "";
        await user.save();

        return res.send({ message: messages.loggedOut });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function for change password
export async function changePassword(req: Request, res: Response) {
    try {
        let user = await users.findOne({ _id: req.body.user_details._id });

        const CheckPassword = await bcrypt.compare(req.body.current_password, user.password);

        if (!CheckPassword) return res.status(400).send({ message: messages.currentPasswordError });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.new_password, salt);
        await user.save();

        return res.status(200).send({ message: messages.passwordChanged });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to edit profile
export async function editProfile(req: Request, res: Response) {
    try {
        // Get the user_id
        const user_id = req.body.user_details._id;

        // find the user
        const profile = await users.findById(user_id);

        // if user has provided username, check if a user already has that username
        // exclude current user from the search
        if (req.body.username) {
            const user = await users.findOne({ username: req.body.username, _id: { $ne: user_id } });
            if (user) return res.status(400).send({ message: messages.usernameInUser });

            if (req.body.username) profile.username = req.body.username;
        }

        // Destination for profile_picture
        const destination = `Socio/users/${profile._id}/profile_picture`;
        let uploadResponse: any;
        let isPicPresent = req.body.profile_picture ? true : false;

        // If profile_picture is present in the request body
        // Upload the profile_picture
        if (isPicPresent) uploadResponse = await uploadProfilePicture(req.body.profile_picture, destination);

        // If response is ok, update profile_picture in the database
        if (isPicPresent) {
            if (uploadResponse?.secure_url?.length) profile.profile_picture = uploadResponse.secure_url;
            else return res.status(400).send({ message: messages.serverError, isLoggedIn: false });
        }

        // Map all the fields to update if they exist
        if (req.body.name) profile.name = req.body.name;
        if (req.body.bio) profile.bio = req.body.bio;

        // Create payload
        let payload = get_login_payload_data(profile);

        const encoded = JWT.payloadEncode(payload);

        // Save the user
        await profile.save();

        // Response
        return res.send({
            user_data: encoded,
            message: "Updated Profile Successfully.",
        });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to send reset password otp
export async function sendResetPasswordOTP(req: Request, res: Response) {
    try {
        // Check if Body consists of email
        if (!req.body.email) return res.status(400).send({ message: messages.emailMissing });

        // Check if email is already in use
        const user = await users.findOne({ email: req.body.email });
        if (!user)
            return res.status(400).send({
                response: "Account with this email does not exist",
            });

        // Create new OTP instance
        const newOtp = await CreateOTP(VERIFICATION_TYPES.FORGOT_PASSWORD);
        if (!newOtp.ok) return res.status(400).send({ message: messages.serverError });

        // Send Email
        const sendMail = await SendOTPEmail({
            to: req.body.email,
            subject: "Password Reset Verification",
            locals: {
                OTP: newOtp.otp,
                operation: "to reset your password.",
            },
        });

        // If email has been sent successfully
        if (sendMail.ok) {
            return res.send({
                message: "OTP has been sent to your email",
                otp_id: newOtp.otp_id,
            });
        }


        return res.status(400).send({
            message: "Error in sending OTP. Server Error",
        });
    } catch (error) {
        return res.status(500).send({
            message: messages.serverError,
        });
    }
}

// function to reset password
export async function resetPassword(req: Request, res: Response) {
    try {
        // Check if request is valid
        const check_request = await resetrequests.findById(req.body.reset_request_id);
        if (!check_request) return res.status(400).send({ message: "Invalid Request" });

        // Find user
        const user = await users.findOne({ email: req.body.email });
        if (!user) return res.status(400).send({ message: "User does not exist with this Email." });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.new_password, salt);

        // Delete the request
        await check_request.delete();

        // If request body has push_notification_token, update it in the database
        if (req.body.push_notification_token)
            user.push_notification_token = req.body.push_notification_token;

        // Save the user
        await user.save();

        // Create userData
        const newUserData = get_encoded_data(user);

        // Return response
        return res.status(200).send({
            user_token: newUserData,
            message: "Password Reset Successfull",
            isLoggedIn: true,
        });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to toggle push notifications
export async function togglePushNotifications(req: Request, res: Response) {
    try {
        const user_id = req.body.user_details._id;

        // find the user
        const user = await users.findById(user_id);

        // Update allow_push_notification status to opposite
        user.allow_push_notification = !user.allow_push_notification;

        // Save the user
        await user.save();

        return res.send({
            current_status: user.allow_push_notification,
            message: "Status has been updated successfully.",
        });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// toggle profile privacy
export async function toggleProfilePrivacy(req: Request, res: Response) {
    try {
        const user_id = req.body.user_details._id;

        // find the user
        const user = await users.findById(user_id);

        // Update private_profile status to opposite
        user.private_profile = !user.private_profile;

        // Save the user
        await user.save();

        return res.send({
            current_status: user.private_profile,
            message: "Status has been updated successfully.",
        });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// refresh token
export async function refreshToken(req: Request, res: Response) {
    try {
        const user = await users.findById(req.body.user_details._id);
        if (!user) return res.status(404).send({ message: messages.accountMissing });

        // Create payload
        const payload = get_refresh_payload(user._id.toString());

        return res.send({ user_token: payload, message: "Token refreshed successfully." });
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}
