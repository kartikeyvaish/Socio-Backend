const _ = require("lodash");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const config = require("../config/Configurations");
const { Helper } = require("../config/Helper");
const { CheckAdminAccess, CheckAuthToken } = Helper;
const { Comments } = require("../models/Comments");
const { Likes } = require("../models/Likes");
const { Posts } = require("../models/Posts");
const { Users, RegisterSchema, LoginSchema } = require("../models/Users");
const {
  SendPushNotification,
  SendGenericNotification,
  BatchPush,
} = require("../config/PushNotifications");

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
    });

    if (req.body.ProfilePicture) {
      if (req.body.ProfilePicture.length) {
        user.ProfilePicture = req.body.ProfilePicture;
      }
    }

    user.PicURL = `${config.apiVersion}/auth/users/${user._id}`;

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
        subText: "",
        title: "Socio",
        message: `Hey ${req.body.Name}, Welcome to Socio.`,
        largeIconUrl: "",
        bigLargeIconUrl: "",
        bigPictureUrl: "",
        channelId: "SocioDefault",
      };
      await SendPushNotification({
        PushToken: req.body.PushToken,
        Data: newNotification,
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

router.put("/reset-password", CheckAuthToken, async (req, res) => {
  try {
    let user = await Users.findOne({ Email: req.body.Email });
    if (!user) return res.status(404).send(config.messages.accountMissing);

    const salt = await bcrypt.genSalt(10);

    user.Password = await bcrypt.hash(req.body.Password, salt);
    await user.save();
    return res.status(200).send(config.messages.passwordChanged);
  } catch (error) {
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

router.get("/users/:id", async (req, res) => {
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

router.post("/send-push-notifications", CheckAdminAccess, async (req, res) => {
  try {
    const response = await SendPushNotification({
      PushToken: req.body.to,
      Data: req.body.data,
      notification: req.body.notification,
    });

    return res.status(response.status).send(response.data);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/generic-push", CheckAdminAccess, async (req, res) => {
  try {
    const response = await SendGenericNotification({
      PushTokens: req.body.to,
      Data: req.body.data,
    });

    return res.status(response.status).send(response.data);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/batch-push", CheckAdminAccess, async (req, res) => {
  try {
    const response = await BatchPush({
      Messages: req.body.Messages,
    });

    return res.status(response.status).send(response.data);
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
