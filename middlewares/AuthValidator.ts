// packages Imports
import { NextFunction, Request, Response } from "express";
import Joi from "joi";

// Imported local modules
import JWT from "../helper/JWT";
import messages from "../config/messages";
import users from "../models/users";

// constants
const MinPasswordLen = 6;
const MaxPasswordLen = 20;

// SignUpSchema to validate the request body
const SignUpSchema = Joi.object({
    name: Joi.string().required().messages({
        "any.required": "Name is required",
        "string.empty": "Name is required",
    }),
    email: Joi.string().email().required().messages({
        "any.required": "Email is required",
        "string.empty": "Email is required",
    }),
    username: Joi.string().required().messages({
        "any.required": "Username is required",
        "string.empty": "Username is required",
    }),
    password: Joi.string()
        .min(6)
        .max(20)
        .required()
        .messages({
            "any.required": "Password is required",
            "string.empty": "Password is required",
            "string.min": `Password must be atleast ${MinPasswordLen} characters long`,
            "string.max": `Password must be atmost ${MaxPasswordLen} characters long`,
        }),
    push_notification_token: Joi.string().allow(""),
    remote_profile_picture: Joi.string().allow("").optional(),
    profile_picture: Joi.binary().optional(),
}).options({ allowUnknown: true });

// google Sign in schema
const GoogleSignInSchema = Joi.object({
    id_token: Joi.string().required().messages({
        "any.required": "ID Token is required",
        "string.empty": "ID Token is required",
    }),
    push_notification_token: Joi.string().allow(""),
}).options({ stripUnknown: true });

// LoginSchema to validate the request body
const LoginSchema = Joi.object({
    email: Joi.string().required().messages({
        "any.required": "Email/Username is required",
        "string.empty": "Email/Username is required",
    }),
    password: Joi.string().required().messages({
        "any.required": "Password is required",
        "string.empty": "Password is required",
    }),
    push_notification_token: Joi.string().allow(""),
}).options({ stripUnknown: true });

// Change Password Schema
const ChangePasswordSchema = Joi.object({
    current_password: Joi.string().required().messages({
        "any.required": "Current Password is required",
        "string.empty": "Current Password is required",
    }),
    new_password: Joi.string()
        .min(6)
        .max(20)
        .required()
        .messages({
            "any.required": "New Password is required",
            "string.empty": "New Password is required",
            "string.min": `Password must be atleast ${MinPasswordLen} characters long`,
            "string.max": `Password must be atmost ${MaxPasswordLen} characters long`,
        }),
}).options({ stripUnknown: true });

const EditProfileSchema = Joi.object({
    name: Joi.string(),
    username: Joi.string(),
    bio: Joi.string(),
    profile_picture: Joi.binary().optional(),
    user_details: Joi.any(),
}).options({ stripUnknown: true });

// function to check if the request has user authorization
export const UserAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authToken = req.headers?.authorization;

        // Check if auth has been provided or not.
        if (!authToken) return res.status(401).send({ message: messages.tokenMissing });

        // Check if the token is valid or not.
        if (typeof authToken !== "string") return res.status(401).send({ message: messages.tokenMissing });

        // Split the bearer
        let result = authToken.split(" ");

        // Check if bearer is valid or not
        if (result.length !== 2)
            return res.status(401).send({ message: messages.tokenMissing });

        // Check access token expiry
        const Token: any = await JWT.access_token_validator(result[1]);

        // If its expired then return error
        if (!Token.ok) return res.status(401).send({ message: messages.unauthorized });

        // Find the user
        const user = await users.findById(Token.decoded._id);

        // If user is not found then return error
        if (!user)
            return res.status(401).send({ message: messages.unauthorized });

        // If user is found then set the user in the request
        req.body.user_details = {
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture,
        };

        // Proceed to next middleware
        next();
    } catch (error) {
        return res.status(500).send({ message: "Token Authentication Failed" });
    }
};

// function to check if refreshToken is valid or not
export const RefreshTokenAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authToken = req.headers?.authorization;

        // Check if auth has been provided or not.
        if (!authToken) return res.status(401).send({ message: messages.tokenMissing });

        // Check if the token is valid or not.
        if (typeof authToken !== "string") return res.status(401).send({ message: messages.tokenMissing });

        // Split the bearer
        let result = authToken.split(" ");

        // Check if bearer is valid or not
        if (result.length !== 2)
            return res.status(401).send({ message: messages.tokenMissing });

        // Check access token expiry
        const Token: any = await JWT.refresh_token_validator(result[1]);

        // If its expired then return error
        if (!Token.ok) return res.status(401).send({ message: messages.unauthorized });

        // Find the user
        const user = await users.findById(Token.decoded._id);

        // If user is not found then return error
        if (!user)
            return res.status(401).send({ message: messages.unauthorized });

        // If user is found then set the user in the request
        req.body.user_details = {
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture,
        };

        // Proceed to next middleware
        next();
    } catch (error) {
        return res.status(500).send({ message: "Token Authentication Failed" });
    }
}

// function to check the request body for SignUp
export const SignUpValidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Create a new body object
        let newBody = { ...req.body };

        // If file is present in the request body
        // change the request body to include the file
        // else if remote uri is present in the request body
        // change the request body to include the remote uri
        if (req.file) if (req.file.buffer) newBody.profile_picture = req.file.buffer;
        if (newBody.remote_profile_picture) newBody.profile_picture = newBody.remote_profile_picture;

        // Check if the request body has api key   
        const authToken = req.headers?.sign_up_key;

        if (authToken !== process.env.SignUP_API_KEY)
            return res.status(400).send({
                message: "Sign Up API Key is required",
            });

        // check for fields
        const result = SignUpSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        req.body = newBody;

        next();
    } catch (error) {
        return res.status(500).send({ message: "Payload Request" });
    }
}

// function to check body of Google Sign in body
export const GoogleSignInValidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check for fields
        const result = GoogleSignInSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        next();
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// fucntion to check the request body for Login
export const LoginValidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check for fields
        const result = LoginSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        next();
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to check the request body for Change Password
export const ChangePasswordValidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // check for fields
        const result = ChangePasswordSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        next();
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}

// function to check the request body for Edit Profile
export const EditProfileValidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Create a new body object
        let newBody = { ...req.body };

        // If file is present in the request body
        // change the request body to include the file
        // else if remote uri is present in the request body
        // change the request body to include the remote uri
        if (req.file) if (req.file.buffer) newBody.profile_picture = req.file.buffer;

        // check for fields
        const result = EditProfileSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });


        req.body = newBody;

        next();
    } catch (error) {
        return res.status(500).send({ message: messages.serverError });
    }
}
