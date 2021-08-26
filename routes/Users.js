const _ = require("lodash");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const moment = require("moment");
const { random } = require("lodash");

const config = require("../config/Configurations");
const { Helper } = require("../config/Helper");
const { CheckAdminAccess, CheckAuthToken } = Helper;
const { Comments } = require("../models/Comments");
const { Likes } = require("../models/Likes");
const { Posts } = require("../models/Posts");
const { Users, RegisterSchema, LoginSchema } = require("../models/Users");
const { OTP } = require("../models/OTP");
const { SendPushNotification } = require("../config/PushNotifications");
const { SendOTPEmail } = require("../config/Mailer");

const TimeLimit = 10;

router.get("/get-users-list", CheckAdminAccess, async (req, res) => {
  try {
    const users = await Users.find({}, { Name: 1, Email: 1, Username: 1 });
    return res.status(200).send({ UsersCount: users.length, Users: users });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { error } = LoginSchema.validate(req.body);
    if (error) return res.status(401).send(error.details[0].message);

    const user = await Users.findOne().or([
      {
        Email: req.body.Email,
      },
      {
        Username: req.body.Email,
      },
    ]);
    if (!user) return res.status(404).send(config.messages.accountMissing);

    const CheckPassword = await bcrypt.compare(
      req.body.Password,
      user.Password
    );
    if (!CheckPassword)
      return res.status(400).send(config.messages.invalidCredentials);

    const decodedUser = _.pick(user.toObject(), [
      "Name",
      "Username",
      "Token",
      "_id",
      "RandomAPI",
      "Email",
      "Bio",
    ]);

    decodedUser.ProfilePicture = user.PicURL;

    const StoreToken = jwt.sign(decodedUser, process.env.JWT_Key);

    if (req.body.PushToken) {
      user.PushToken = req.body.PushToken;
      await user.save();
    }

    return res.status(200).send({ User: decodedUser, StoreToken: StoreToken });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/register", async (req, res) => {
  try {
    const { error } = RegisterSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const checkEmail = await Users.findOne({ Email: req.body.Email });
    if (checkEmail)
      return res.status(403).send(config.messages.emailAlreadyInUse);

    const checkUsername = await Users.findOne({ Username: req.body.Username });
    if (checkUsername)
      return res.status(403).send(config.messages.UsernameAlreadyInUse);

    let user = new Users({
      Name: req.body.Name,
      Email: req.body.Email,
      Username: req.body.Username,
      Password: req.body.Password,
      Admin: req.body.Admin || false,
      AccountVerified: false,
      EmailVerified: req.body.EmailVerified || false,
    });

    if (req.body.ProfilePicture) {
      if (req.body.ProfilePicture.length) {
        user.ProfilePicture = req.body.ProfilePicture;
      }
    }

    user.PicURL = `${process.env.apiVersion}/auth/users/${user._id}`;

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(user.Password, salt);

    const Token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_Key
    );

    user.Token = Token;

    if (req.body.PushToken) {
      user.PushToken = req.body.PushToken;
      const newNotification = {
        body: `Hey ${req.body.Name}, Welcome to Socio.`,
        title: "Socio",
      };
      await SendPushNotification({
        PushToken: req.body.PushToken,
        Data: {},
        notification: newNotification,
      });
    }

    await user.save();

    const decodedUser = _.pick(user.toObject(), [
      "Name",
      "Email",
      "Username",
      "Token",
      "_id",
    ]);

    decodedUser.ProfilePicture = user.PicURL;

    const StoreToken = jwt.sign(decodedUser, process.env.JWT_Key);

    return res.status(200).send({ User: decodedUser, StoreToken: StoreToken });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/logout", CheckAuthToken, async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.body.CalledBy._id });
    if (!user) return res.status(404).send(config.messages.accountMissing);

    user.PushToken = "";
    await user.save();

    return res.send("You are now logged out");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/email-register", async (req, res) => {
  try {
    if (req.query?.email) {
      const user = await Users.findOne({ Email: req.query.email });
      if (user)
        return res.status(401).send({
          response: `${config.messages.accountMissing}. Proceed to Login`,
        });

      const createdAt = moment();
      const validTill = moment(createdAt).add(TimeLimit, "minutes");
      const OTP_Random = random(100000, 999999);

      const newOtp = new OTP({
        Verification: {
          Type: "Email",
          Email: req.query.email,
        },
        CreatedAt: createdAt,
        ValidTill: validTill,
        OTP: OTP_Random,
      });

      await newOtp.save();

      const sendMail = await SendOTPEmail({
        to: req.query.email,
        subject: "Email Verification",
        locals: {
          OTP: OTP_Random,
        },
      });

      if (sendMail.ok) {
        return res.status(200).send({
          response: _.pick(newOtp.toObject(), ["_id"]),
        });
      } else {
        return res.status(500).send({
          response: config.messages.serverError,
        });
      }
    } else {
      return res.status(404).send({
        response: `Email ID is required`,
      });
    }
  } catch (error) {
    return res.status(500).send({
      response: config.messages.serverError,
    });
  }
});

router.post("/forgot-otp-check-email", async (req, res) => {
  try {
    if (req.body?.email) {
      const user = await Users.findOne({ Email: req.body.email });
      if (!user)
        return res.status(401).send({
          response: `Account. With this email not found`,
        });

      const createdAt = moment();
      const validTill = moment(createdAt).add(TimeLimit, "minutes");
      const OTP_Random = random(100000, 999999);

      const newOtp = new OTP({
        Verification: {
          Type: "ForgotPassword",
          Email: req.body.email,
        },
        CreatedAt: createdAt,
        ValidTill: validTill,
        OTP: OTP_Random,
      });

      await newOtp.save();

      const sendMail = await SendOTPEmail({
        to: req.body.email,
        subject: "Forgot Password OTP",
        locals: {
          OTP: OTP_Random,
        },
      });

      if (sendMail.ok) {
        return res.status(200).send({
          response: _.pick(newOtp.toObject(), ["_id"]),
        });
      } else {
        return res.status(500).send({
          response: config.messages.serverError,
        });
      }
    } else {
      return res.status(404).send({
        response: `Email ID is required`,
      });
    }
  } catch (error) {
    return res.status(500).send({
      response: config.messages.serverError,
    });
  }
});

router.get("/search-users", CheckAuthToken, async (req, res) => {
  try {
    let search = req.query.search;
    let UsernameFilter = search.split(" ").map((s) => {
      return {
        Username: {
          $regex: s,
          $options: "i",
        },
      };
    });

    let NameFilter = search.split(" ").map((s) => {
      return {
        Name: {
          $regex: s,
          $options: "i",
        },
      };
    });

    const searchUsers = await Users.find(
      {
        $or: [...UsernameFilter, ...NameFilter],
      },
      { Name: 1, Username: 1 }
    );

    res.send({ SearchCount: searchUsers.length, Results: searchUsers });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.put("/change-password", CheckAuthToken, async (req, res) => {
  try {
    let user = await Users.findOne({ _id: req.body.CalledBy._id });
    if (!user) return res.status(404).send(config.messages.accountMissing);

    const CheckPassword = await bcrypt.compare(
      req.body.CurrentPassword,
      user.Password
    );
    if (!CheckPassword)
      return res.status(400).send(config.messages.currentPasswordError);

    const salt = await bcrypt.genSalt(10);
    user.Password = await bcrypt.hash(req.body.NewPassword, salt);
    await user.save();
    return res.status(200).send(config.messages.passwordChanged);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    console.log(req.body);
    let user = await Users.findOne({ Email: req.body.Email });
    if (!user) return res.status(404).send(config.messages.accountMissing);

    const salt = await bcrypt.genSalt(10);

    user.Password = await bcrypt.hash(req.body.Password, salt);
    await user.save();
    return res.status(200).send(config.messages.passwordChanged);
  } catch (error) {
    console.log(error);
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-account", CheckAuthToken, async (req, res) => {
  try {
    await Posts.deleteMany({
      UserID: req.body.CalledBy._id,
    });

    await Likes.deleteMany({
      UserID: req.body.CalledBy._id,
    });

    await Comments.deleteMany({
      UserID: req.body.CalledBy._id,
    });

    const user = await Users.findOne({
      _id: req.body.CalledBy._id,
    });

    await user.delete();
    return res.send(config.messages.accountDeleted);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get("/users/:id*", async (req, res) => {
  try {
    const user = await Users.findById({ _id: req.params.id });
    let toSendPicture = "";
    if (user) {
      if (user.ProfilePicture === "/uploads/DefaultImage.png") {
        toSendPicture = process.env.defaultProfileImage;
      } else {
        toSendPicture = user.ProfilePicture;
      }
    } else {
      toSendPicture = process.env.defaultProfileImage;
    }

    const ReplacedBASE = toSendPicture.replace(/^data:image\/\w+;base64,/, "");
    const ProfilePicture = Buffer.from(ReplacedBASE, "base64");
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": ProfilePicture.length,
    });
    res.end(ProfilePicture);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
