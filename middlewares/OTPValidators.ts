// packages Imports
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import mongoose from "mongoose";

const MinPasswordLen = 6;
const MaxPasswordLen = 20;

// schmea to verify the otp sending request
const OTPSignUpSchema = Joi.object({
    email: Joi.string().email().required().label("Email").messages({
        "any.required": `Email is required`,
        "string.empty": `Email cannot be an empty field`,
    }),
}).options({ stripUnknown: true });

// schema to verify the otp verifying request
const OTPVerifySchema = Joi.object({
    otp_id: Joi.string().required().messages({
        "any.required": `OTP ID is required`,
        "string.empty": `OTP ID cannot be an empty field`,
    }),
    otp: Joi.string().length(6).required().messages({
        "any.required": `OTP is required`,
        "string.empty": `OTP cannot be an empty field`,
    }),
    verification_type: Joi.string().required().messages({
        "any.required": `Verification Type is required`,
        "string.empty": `Verification Type cannot be an empty field`,
    }),
}).options({ stripUnknown: true });

// schema to verify the otp verifying request
const ResetPasswordSchema = Joi.object({
    new_password: Joi.string()
        .min(6)
        .max(20)
        .required()
        .messages({
            "any.required": "Password is required",
            "string.empty": "Password is required",
            "string.min": `Password must be atleast ${MinPasswordLen} characters long`,
            "string.max": `Password must be atmost ${MaxPasswordLen} characters long`,
        }),
    reset_request_id: Joi.string().required().messages({
        "any.required": `Reset Request ID is required`,
        "string.empty": `Reset Request ID cannot be an empty field`,
    }),
    email: Joi.string().email().required().messages({
        "any.required": `Email is required`,
        "string.empty": `Email cannot be an empty field`,
    }),
    push_notification_token: Joi.string().optional().allow(""),
}).options({ stripUnknown: true });

// function to check that request has auth key
export const CheckOTPSendAuth = (req: Request, res: Response, next: NextFunction) => {
    // get authToken    
    const authToken = req.headers?.otp_send_key;

    if (authToken !== process.env.OTP_Email_Send_Key)
        return res.status(404).send({
            message: "API Key is required",
        });

    next();
};

// function to check if the payload contains valid otp send request body
export const OTPSignUpValidate = async (req: Request, res: Response, next: NextFunction) => {
    const validate = OTPSignUpSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    next();
};

// function to check otp verifying body
export const OTPVerifyValidate = async (req: Request, res: Response, next: NextFunction) => {
    const validate = OTPVerifySchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(req.body.otp_id);
    if (!validID) return res.status(400).json({ message: "Invalid Comment ID" });

    next();
};

// function to check that request body is correct for Reset Password
export const ResetPasswordValidate = (req: Request, res: Response, next: NextFunction) => {
    const validate = ResetPasswordSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(req.body.reset_request_id);
    if (!validID) return res.status(400).json({ message: "Invalid Comment ID" });

    next();
};
