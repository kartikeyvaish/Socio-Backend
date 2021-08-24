const express = require("express");
const router = express.Router();

const config = require("../config/Configurations");

const { Helper } = require("../config/Helper");
const { Followers } = require("../models/Followers");
const { Following } = require("../models/Following");
const { Notifications } = require("../models/Notifications");
const { Posts } = require("../models/Posts");
const { Requests } = require("../models/Requests");
const { Users } = require("../models/Users");

const { CheckAuthToken, CheckAdminAccess } = Helper;

router.get("/get-all-notifications", CheckAdminAccess, async (req, res) => {
  try {
    const allNotif = await Notifications.find();
    return res
      .status(200)
      .send({ NotificationsCount: allNotif.length, Notifications: allNotif });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.get(
  "/get-all-notifications-for-user",
  CheckAuthToken,
  async (req, res) => {
    try {
      const allNotif = await Notifications.find({
        UserID: req.body.CalledBy._id,
      });

      const allreq = await Requests.find({
        "RequestedTo.UserID": req.body.CalledBy._id,
      });

      return res.status(200).send({
        NotificationsCount: allNotif.length,
        Notifications: allNotif,
        FollowRequests: allreq,
      });
    } catch (error) {
      return res.status(500).send(config.messages.serverError);
    }
  }
);

module.exports = router;
