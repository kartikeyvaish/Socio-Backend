// packages Imports
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import mongoose from "mongoose";

// StoryEditBodySchema to validate the request body
const StoryEditBodySchema = Joi.object({
    story_id: Joi.string().required().messages({
        "any.required": "Story ID is required",
        "string.empty": "Story ID cannot be empty",
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// NewStorySchema to validate the request body
const NewStorySchema = Joi.object({
    file: Joi.binary().required().messages({
        "any.required": "File is required",
        "string.empty": "File is required",
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// function top validate request body using StoryEditBodySchema 
export const validateStoryBody = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.query, ...req.body };
    req.body = body;

    const validate = StoryEditBodySchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(req.body.story_id);
    if (!validID) return res.status(400).json({ message: "Invalid Story ID" });

    next();
};

// function to validate request body using NewStorySchema
export const validateNewStoryBody = (req: Request | any, res: Response, next: NextFunction) => {
    // Create a new body object
    let newBody = { ...req.body };

    // If file is present in the request body
    // change the request body to include the file 
    if (req.file?.buffer) newBody.file = req.file?.buffer;

    // check for fields
    const result = NewStorySchema.validate(newBody);

    if (result.error)
        return res.status(400).send({
            message: result.error.details[0].message,
        });

    req.body = newBody;

    next();
}
