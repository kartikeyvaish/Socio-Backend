const express = require("express");
const router = express.Router();
const _ = require("lodash");

const config = require("../config/Configurations");
const { Helper } = require("../config/Helper");
const { CheckAdminAccess } = Helper;
const {
  SendPushNotification,
  SendGenericNotification,
  BatchPush,
} = require("../config/PushNotifications");

router.post("/send-push-notifications", CheckAdminAccess, async (req, res) => {
  try {
    const response = await SendPushNotification({
      PushToken: req.body.to,
      Data: req.body.data,
      notification: req.body.notification,
      channel_id: req.body.channel_id,
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
