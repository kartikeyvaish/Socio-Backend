// packages Imports
import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import mongoose from "mongoose";

// GetPeopleIDSchema to validate the request body
const GetPeopleIDSchema = Joi.object({
    user_id: Joi.string().required().messages({
        "string.base": "User ID must be a string",
        "string.empty": "User ID cannot be empty",
        "string.required": "User ID is required"
    }),
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

// RequestSchema to validate the request body
const RequestSchema = Joi.object({
    request_id: Joi.string().required().messages({
        "string.base": "User ID must be a string",
        "string.empty": "User ID cannot be empty",
        "string.required": "User ID is required"
    }),
    user_details: Joi.any()
}).options({ stripUnknown: true });

// function top validate request body using GetPeopleIDSchema 
export const validatePeopleGetID = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.query, ...req.body };
    req.body = body;

    const validate = GetPeopleIDSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(req.body.user_id);
    if (!validID) return res.status(400).json({ message: "Invalid User ID" });

    next();
};

// function top validate request body using RequestSchema
export const validateRequestID = (req: Request, res: Response, next: NextFunction) => {
    let body = { ...req.query, ...req.body };
    req.body = body;

    const validate = RequestSchema.validate(req.body);

    if (validate.error) {
        return res
            .status(400)
            .send({ message: validate.error.details[0].message });
    }

    const validID = mongoose.isValidObjectId(req.body.request_id);
    if (!validID) return res.status(400).json({ message: "Invalid Request ID" });

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
