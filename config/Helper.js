const jwt = require("jsonwebtoken");

const config = require("./Configurations");
const { Users } = require("../models/Users");

const CheckAdminAccess = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;

    if (authToken) {
      let result = authToken.split(" ");
      if (result.length !== 2)
        return res.status(403).send(config.messages.tokenMissing);

      const Token = jwt.decode(result[1], process.env.JWT_Key);

      if (Token) {
        const checkUser = await Users.findOne({ _id: Token._id });

        if (!checkUser)
          return res.status(403).send(config.messages.unauthorized);

        if (checkUser.Admin === false)
          return res.status(403).send(config.messages.unauthorized);

        next();
      } else {
        return res.status(403).send(config.messages.unauthorized);
      }
    } else {
      return res.status(403).send(config.messages.tokenMissing);
    }
  } catch (error) {
    return res.status(501).send(config.messages.serverError);
  }
};

const CheckAuthToken = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;

    if (authToken) {
      let result = authToken.split(" ");
      if (result.length !== 2)
        return res.status(403).send(config.messages.tokenMissing);

      const Token = jwt.decode(result[1], process.env.JWT_Key);

      if (Token) {
        const checkUser = await Users.findOne({ _id: Token._id });

        if (!checkUser)
          return res.status(403).send(config.messages.unauthorized);

        req.body.CalledBy = {
          _id: checkUser._id,
          Username: checkUser.Username,
          Email: checkUser.Email,
          Name: checkUser.Name,
          PicURL: checkUser.PicURL,
        };

        next();
      } else {
        return res.status(403).send(config.messages.unauthorized);
      }
    } else {
      return res.status(403).send(config.messages.tokenMissing);
    }
  } catch (error) {
    return res.status(501).send(config.messages.serverError);
  }
};

const GiveMimeType = (File) => {
  let URL = File.toLowerCase();
  let ImageExts = ["jpg", "png", "jpeg"];
  let VideoExts = ["mp4", "3gp"];
  let AudioExts = ["m4a", "mp3", "wav"];
  let Exts = URL.split(".").pop();
  if (ImageExts.indexOf(Exts) > -1) {
    return `image/${ImageExts[ImageExts.indexOf(Exts)]}`;
  } else if (VideoExts.indexOf(Exts) > -1) {
    return `video/${VideoExts[VideoExts.indexOf(Exts)]}`;
  } else if (AudioExts.indexOf(Exts) > -1) {
    return `audio/${AudioExts[AudioExts.indexOf(Exts)]}`;
  } else {
    return "none";
  }
};

const GiveMimeName = (File) => {
  let URL = File.toLowerCase();
  let ImageExts = ["jpg", "png", "jpeg"];
  let VideoExts = ["mp4", "3gp"];
  let AudioExts = ["m4a", "mp3", "wav"];
  let Exts = URL.split(".").pop();
  if (ImageExts.indexOf(Exts) > -1) {
    return `image`;
  } else if (VideoExts.indexOf(Exts) > -1) {
    return `video`;
  } else if (AudioExts.indexOf(Exts) > -1) {
    return `audio`;
  } else {
    return "none";
  }
};

const Helper = {
  CheckAdminAccess,
  CheckAuthToken,
  GiveMimeType,
  GiveMimeName,
};

exports.Helper = Helper;
