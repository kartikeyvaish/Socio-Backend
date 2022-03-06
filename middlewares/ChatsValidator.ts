// packages Imports
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import mongoose from "mongoose";

// GetPeopleIDSchema to validate the request body
const GetPeopleIDSchema = Joi.object({
    user_id: Joi.string().required().messages({
        "string.base": "User ID must be a string",
        "string.empty": "User ID cannot be empty",
        "any.required": "User ID is required"
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// GetChatsSchema to validate the request body
const GetChatsSchema = Joi.object({
    chat_id: Joi.string().required().messages({
        "string.base": "Chat ID must be a string",
        "string.empty": "Chat ID cannot be empty",
        "any.required": "Chat ID is required"
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// validate send request body schema
const SendMessageSchema = Joi.object({
    chat_id: Joi.string().required().messages({
        "string.base": "Chat ID must be a string",
        "string.empty": "Chat ID cannot be empty",
        "any.required": "Chat ID is required"
    }),
    message_type: Joi.string().valid("image", "video", "audio", "text").required().messages({
        "string.base": "Message type must be a string",
        "string.empty": "Message type cannot be empty",
        "any.required": "Message type is required"
    }),
    message: Joi.when("message_type", {
        is: Joi.string().valid("text"),
        then: Joi.string().required().messages({
            "string.base": "Message must be a string",
            "string.empty": "Message cannot be empty",
            "any.required": "Message is required"
        }),
        otherwise: Joi.optional().allow("")
    }),
    message_file: Joi.binary(),
    thumbnail_image: Joi.when("message_type", {
        is: Joi.string().valid("video"),
        then: Joi.binary().required().messages({
            "binary.base": "Thumbnail Image must be a image",
            "any.required": "Thumbnail Image is required because message type is video"
        }),
        otherwise: Joi.any()
    }),
    mimeType: Joi.string().allow(""),
    thumbnail_mimeType: Joi.string().allow(""),
    read: Joi.boolean().default(false),
    user_details: Joi.any()
}).options({ stripUnknown: false, allowUnknown: true });

// validate get messages request body schema
const GetMessagesSchema = Joi.object({
    chat_id: Joi.string().required().messages({
        "string.base": "Chat ID must be a string",
        "string.empty": "Chat ID cannot be empty",
        "any.required": "Chat ID is required"
    }),
    skip: Joi.number(),
    count: Joi.number(),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// Search People Schema
const SearchPeopleSchema = Joi.object({
    query: Joi.string().required().messages({
        "string.base": "Search Query must be a string",
        "string.empty": "Search Query cannot be empty",
        "string.required": "Search Query is required"
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// function top validate request body using GetPeopleIDSchema 
export const validateNewChatBody = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.body };
    req.body = body;

    const validate = GetPeopleIDSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const current_user = req.body.user_details._id;
    const called_user = req.body.user_id;

    if (called_user.toString() === current_user.toString())
        return res.status(400).send({ message: "Cannot create chat with yourself." });

    const validID = mongoose.isValidObjectId(called_user);
    if (!validID) return res.status(400).json({ message: "Invalid User ID" });

    next();
};

// function to validate chat id body
export const validateChatIDBody = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.body };
    req.body = body;

    const validate = GetChatsSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(req.body.chat_id);
    if (!validID) return res.status(400).json({ message: "Invalid Chat ID" });

    next();
}

// function to validate send message body
export const validateSendMessageBody = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.body };

    const validID = mongoose.isValidObjectId(body.chat_id);
    if (!validID) return res.status(400).json({ message: "Invalid Chat ID" });

    let files: any = req.files

    // if file is present
    if (Object.keys(files).length !== 0) {
        let message_file = files.message_file?.[0];
        let thumbnail_image = files.thumbnail_image?.[0];

        if (message_file) {
            body.mimeType = message_file.mimetype;
            body.message_type = body.mimeType.slice(0, 5);
            body.message_file = message_file.buffer;

            // If filetype is not image, video or audio then return error
            if (["audio", "image", "video"].indexOf(body.message_type) === -1)
                return res.status(400).json({ message: "Invalid File Type" });
        }

        if (files.thumbnail_image) {
            body.thumbnail_image = thumbnail_image.buffer;
            body.thumbnail_mimeType = thumbnail_image.mimetype;
        }

    } else {
        body.message_type = "text"
    }

    const validate = SendMessageSchema.validate(body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    req.body = body;

    next();
}

// function to validate get messages body
export const validateGetMessagesBody = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.body, ...req.query };

    const validate = GetMessagesSchema.validate(body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(body.chat_id);
    if (!validID) return res.status(400).json({ message: "Invalid Chat ID" });

    req.body = body;

    next();
}

// function to validate search body
export const validateSearchPeople = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.query, ...req.body };
    req.body = body;

    const validate = SearchPeopleSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    next();
}
