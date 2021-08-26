const mongoose = require("mongoose");
const Joi = require("joi");

const RegisterSchema = Joi.object({
  Name: Joi.string().required(),
  Email: Joi.string().email().required(),
  Username: Joi.string().required(),
  Password: Joi.string().min(3).max(15).required(),
}).options({ allowUnknown: true });

const LoginSchema = Joi.object({
  Email: Joi.string().required(),
  Password: Joi.string().required(),
}).options({ allowUnknown: true });

const Users = mongoose.model(
  "Users",
  new mongoose.Schema({
    Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
    },
    Username: {
      type: String,
      required: true,
      unique: true,
    },
    ProfilePicture: {
      type: String,
      default: "/uploads/DefaultImage.png",
    },
    PicURL: {
      type: String,
      default: "",
    },
    PushToken: {
      type: String,
      default: "",
    },
    Password: {
      type: String,
      required: true,
    },
    Token: {
      type: String,
      default: "",
    },
    Bio: {
      type: String,
      default: "",
    },
    AccountVerified: {
      type: Boolean,
      default: false,
    },
    EmailVerified: {
      type: Boolean,
      default: false,
    },
    Private: {
      type: Boolean,
      default: false,
    },
    Admin: {
      type: Boolean,
      default: false,
    },
  })
);

exports.Users = Users;
exports.RegisterSchema = RegisterSchema;
exports.LoginSchema = LoginSchema;
