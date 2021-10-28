// package and other modules
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const moment = require("moment");

// static imports
const messages = require("../config/messages");
const { LoginSchema, AdminAuth, UserAuth } = require("../schemas/Auth");
const { OTP } = require("../models/OTP");
const { SendOTPEmail } = require("../utils/mailer");
const { UploadToCloudinary } = require("../utils/cloudinary");
const { users } = require("../models/Users");
const { random, pick } = require("lodash");
const { ValidateRegisterBody } = require("../schemas/Register");

// Initialize router
const router = express.Router();

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

// Get List of all users in Database
router.get("/get-all-users-list", AdminAuth, async (req, res) => {
  try {
    const usersList = await users.find(
      {},
      { Name: 1, Email: 1, Username: 1, ProfilePicture: 1 }
    );

    return res.status(200).send({ UsersList: usersList });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Search for users based on a query
router.get("/search-users", UserAuth, async (req, res) => {
  try {
    const { search } = req.query;

    const usersList = await users.find(
      {
        $or: [
          { Name: { $regex: search, $options: "i" } },
          { Username: { $regex: search, $options: "i" } },
        ],
      },
      { Name: 1, Email: 1, Username: 1, ProfilePicture: 1 }
    );

    return res
      .status(200)
      .send({ Users: usersList, UsersCount: usersList.length });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Register endpoint
router.post(
  "/register",
  upload.single("ProfilePicture"),
  ValidateRegisterBody,
  async (req, res) => {
    try {
      const checkEmail = await users.findOne({ Email: req.body.Email });
      if (checkEmail) return res.status(403).send(messages.emailAlreadyInUse);

      const checkUsername = await users.findOne({
        Username: req.body.Username,
      });
      if (checkUsername)
        return res.status(403).send(messages.UsernameAlreadyInUse);

      let user = new users({
        Name: req.body.Name,
        Email: req.body.Email,
        Username: req.body.Username,
        Password: req.body.Password,
      });
      const destination = `users/${user._id}/ProfilePicture`;

      if (req.body.ProfilePicture) {
        const uploadResponse = await UploadToCloudinary(
          req.body.ProfilePicture,
          destination
        );

        if (uploadResponse?.url?.length)
          user.ProfilePicture = uploadResponse.url;
        else return res.status(500).send(messages.serverError);
      }

      const salt = await bcrypt.genSalt(10);
      user.Password = await bcrypt.hash(user.Password, salt);

      const Token = jwt.sign(
        {
          _id: user._id,
        },
        process.env.JWT_Key
      );

      user.Token = Token;

      await user.save();

      const decodedUser = pick(user.toObject(), [
        "Name",
        "Email",
        "Username",
        "Token",
        "_id",
        "ProfilePicture",
      ]);

      return res.status(200).send({ User: decodedUser });
    } catch (error) {
      return res.status(500).send(messages.serverError);
    }
  }
);

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { error } = LoginSchema.validate(req.body);
    if (error) return res.status(401).send(error.details[0].message);

    const user = await users.findOne().or([
      {
        Email: req.body.Email,
      },
      {
        Username: req.body.Email,
      },
    ]);
    if (!user) return res.status(404).send(messages.accountMissing);

    const CheckPassword = await bcrypt.compare(
      req.body.Password,
      user.Password
    );
    if (!CheckPassword)
      return res.status(400).send(messages.invalidCredentials);

    if (req.body.PushNotificationToken) {
      user.PushNotificationToken = req.body.PushNotificationToken;
      await user.save();
    }

    const decodedUser = pick(user.toObject(), [
      "Name",
      "Username",
      "Token",
      "_id",
      "Email",
      "Bio",
      "ProfilePicture",
    ]);

    return res.status(200).send({ User: decodedUser });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Logout endpoint
router.delete("/logout", UserAuth, async (req, res) => {
  try {
    const user = await users.findOne({ _id: req.body.user_details._id });
    if (!user) return res.status(404).send(messages.accountMissing);

    user.PushNotificationToken = "";
    await user.save();

    return res.send(messages.loggedtOut);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Change Password endpoint
router.put("/change-password", UserAuth, async (req, res) => {
  try {
    let user = await users.findOne({ _id: req.body.user_details._id });
    if (!user) return res.status(404).send(messages.accountMissing);

    const CheckPassword = await bcrypt.compare(
      req.body.CurrentPassword,
      user.Password
    );

    if (!CheckPassword)
      return res.status(400).send(messages.currentPasswordError);

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(req.body.NewPassword, salt);
    await user.save();

    return res.status(200).send(messages.passwordChanged);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Send Email Register First OTP endpoint
router.post("/send-email-register-otp", async (req, res) => {
  try {
    if (req.body?.Email) {
      const user = await users.findOne({ Email: req.body.Email });
      if (user)
        return res.status(401).send({
          response: messages.associatedAccount,
        });

      const createdAt = moment();
      const OTP_Random = random(100000, 999999);

      const newOtp = new OTP({
        Verification: {
          Type: "Email",
          Email: req.body.Email,
        },
        CreatedAt: createdAt,
        OTP: OTP_Random,
      });

      await newOtp.save();

      const sendMail = await SendOTPEmail({
        to: req.body.Email,
        subject: "Email Verification",
        locals: {
          OTP: OTP_Random,
        },
      });

      if (sendMail.ok) {
        return res.status(200).send({
          response: pick(newOtp.toObject(), ["_id"]),
        });
      } else {
        return res.status(500).send({
          response: messages.serverError,
        });
      }
    } else {
      return res.status(404).send({
        response: messages.emailRequired,
      });
    }
  } catch (error) {
    return res.status(500).send({
      response: messages.serverError,
    });
  }
});

// Send Forgot Password OTP Endpoint
router.post("/send-forgot-password-otp", async (req, res) => {
  try {
    if (req.body?.Email) {
      const user = await users.findOne({ Email: req.body.Email });
      if (!user)
        return res.status(401).send({
          response: messages.accountMissing,
        });

      const createdAt = moment();
      const OTP_Random = random(100000, 999999);

      const newOtp = new OTP({
        Verification: {
          Type: "ForgotPassword",
          Email: req.body.Email,
        },
        CreatedAt: createdAt,
        OTP: OTP_Random,
      });

      await newOtp.save();

      const sendMail = await SendOTPEmail({
        to: req.body.Email,
        subject: "Forgot Password OTP",
        locals: {
          OTP: OTP_Random,
        },
      });

      if (sendMail.ok) {
        return res.status(200).send({
          response: pick(newOtp.toObject(), ["_id"]),
        });
      } else {
        return res.status(500).send({
          response: messages.serverError,
        });
      }
    } else {
      return res.status(404).send({
        response: messages.emailRequired,
      });
    }
  } catch (error) {
    return res.status(500).send({
      response: messages.serverError,
    });
  }
});

// Reset Password endpoint
router.post("/reset-password", async (req, res) => {
  try {
    let user = await users.findOne({ Email: req.body.Email });
    if (!user) return res.status(404).send(messages.accountMissing);

    // check if OTP_ID is provided
    if (!req.body.OTP_ID) return res.status(400).send("OTP ID is required");

    // Check if the OTP_ID exists in OTP collection or not.
    const OTP_Exists = await OTP.findById(req.body.OTP_ID);
    if (!OTP_Exists) return res.status(404).send("Invalid OTP");

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(req.body.Password, salt);
    await user.save();

    return res.status(200).send(messages.passwordChanged);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// Delete Account Endpoint
router.delete("/delete-account", UserAuth, async (req, res) => {
  try {
    const user = await users.findOne({
      _id: req.body.user_details._id,
    });

    await user.delete();
    return res.send(messages.accountDeleted);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

// export router
module.exports = router;
