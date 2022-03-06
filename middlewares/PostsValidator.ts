// packages Imports
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import mongoose from "mongoose";

// GetPostsSchema
const GetPostsSchema = Joi.object({
    last_post_id: Joi.string(),
    limit: Joi.number().integer(),
    user_details: Joi.any(),
}).options({ stripUnknown: true });

// PostsSchema to validate the request body
const PostsSchema = Joi.object({
    caption: Joi.string().allow("").optional(),
    location: Joi.string().allow("").optional(),
    file: Joi.binary().required().messages({
        "any.required": "File is required",
        "string.empty": "File is required",
    }),
    thumbnail_image: Joi.binary().optional(),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// Schema to validate the request body of delete post
const PostIDSchema = Joi.object({
    post_id: Joi.string().required().messages({
        "any.required": "Post id is required",
        "string.empty": "Post id is required",
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// Schema to validate new comment request body
const CommentSchema = Joi.object({
    post_id: Joi.string().required().messages({
        "any.required": "Post id is required",
        "string.empty": "Post id is required",
    }),
    comment: Joi.string().required().messages({
        "any.required": "Comment is required",
        "string.empty": "Comment is required",
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// Schema to validate delete comment request body
const CommentIDSchema = Joi.object({
    comment_id: Joi.string().required().messages({
        "any.required": "Comment id is required",
        "string.empty": "Comment id is required",
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// function to check the request body for creating new posts
export const PostsBodyValidate = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        // Create a new body object
        let newBody = { ...req.body };

        // If file is present in the request body
        // change the request body to include the file
        // else if remote uri is present in the request body
        // change the request body to include the remote uri
        if (req.files.file?.[0]?.buffer) newBody.file = req.files.file?.[0]?.buffer;
        if (req.files.thumbnail_image?.[0]?.buffer) newBody.thumbnail_image = req.files.thumbnail_image?.[0]?.buffer;

        let mimeType = req.files.file?.[0]?.mimetype;
        if (mimeType.slice(0, 5) === "video" && !req.files.thumbnail_image?.[0]?.buffer) return res.status(400).send({ message: "Thumbnail image is required" });

        // check for fields
        const result = PostsSchema.validate(newBody);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        newBody.mimeType = mimeType;

        req.body = newBody;

        next();
    } catch (error) {
        return res.status(500).send({ message: "Invalid Post Payload Request" });
    }
}

// function to validate post deletion request
export const PostIDVBodyValidate = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const newBody = { ...req.body, ...req.query };

        // check for fields
        const result = PostIDSchema.validate(newBody);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });


        const validID = mongoose.isValidObjectId(newBody.post_id);
        if (!validID) return res.status(400).json({ message: "Invalid Post ID" });

        req.body = newBody;

        next();
    } catch (error) {
        return res.status(500).send({ message: "Invalid Post Delete Request Payload" });
    }
}

// function to validate new comment request body
export const CommentBodyValidate = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        // check for fields
        const result = CommentSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        const validID = mongoose.isValidObjectId(req.body.post_id);
        if (!validID) return res.status(400).json({ message: "Invalid Post ID" });

        next();
    } catch (error) {
        return res.status(500).send({ message: "Invalid Comment Payload Request" });
    }
}

// function to valdate comment deletion request body
export const CommentIDVBodyValidate = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        // check for fields
        const result = CommentIDSchema.validate(req.body);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        const validID = mongoose.isValidObjectId(req.body.comment_id);
        if (!validID) return res.status(400).json({ message: "Invalid Comment ID" });

        next();
    } catch (error) {
        return res.status(500).send({ message: "Invalid Comment Delete Payload Request" });
    }
}

// function to validate getPosts request body
export const GetPostsBodyValdiate = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        // Create a new body object
        let newBody = { ...req.body, ...req.query };

        // check for fields
        const result = GetPostsSchema.validate(newBody);

        if (result.error)
            return res.status(400).send({
                message: result.error.details[0].message,
            });

        req.body = newBody;

        next();
    } catch (error) {
        return res.status(500).send({ message: "Invalid Get Posts Payload Request" });
    }
}