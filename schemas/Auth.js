// Import the required modules
const Joi = require("joi");
const jwt = require("jsonwebtoken");

// Imported static modules
const messages = require("../config/messages");
const { users } = require("../models/Users");

// function to check if the request has admin authorization
const AdminAuth = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;

    if (authToken) {
      let tokenArray = authToken.split(" ");

      if (tokenArray.length !== 2)
        return res.status(403).send(messages.tokenMissing);

      const Token = jwt.decode(tokenArray[1], process.env.JWT_Key);

      if (Token) {
        const checkUser = await users.findOne({ _id: Token._id });

        if (!checkUser) return res.status(403).send(messages.unauthorized);

        if (checkUser.Admin === false)
          return res.status(403).send(messages.unauthorized);

        next();
      } else {
        return res.status(403).send(messages.unauthorized);
      }
    } else {
      return res.status(403).send(messages.tokenMissing);
    }
  } catch (error) {
    return res.status(501).send(messages.serverError);
  }
};

// function to check if the request has user authorization
const UserAuth = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;

    if (authToken) {
      let result = authToken.split(" ");

      if (result.length !== 2)
        return res.status(403).send(messages.tokenMissing);

      const Token = jwt.decode(result[1], process.env.JWT_Key);

      if (Token) {
        const checkUser = await users.findOne({ _id: Token._id });

        if (!checkUser) return res.status(403).send(messages.unauthorized);

        req.body.user_details = {
          _id: checkUser._id,
          Name: checkUser.Name,
          Username: checkUser.Username,
          Email: checkUser.Email,
          ProfilePicture: checkUser.ProfilePicture,
        };

        next();
      } else return res.status(403).send(messages.unauthorized);
    } else return res.status(403).send(messages.tokenMissing);
  } catch (error) {
    return res.status(501).send(messages.serverError);
  }
};

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

exports.RegisterSchema = RegisterSchema;
exports.LoginSchema = LoginSchema;
exports.AdminAuth = AdminAuth;
exports.UserAuth = UserAuth;
