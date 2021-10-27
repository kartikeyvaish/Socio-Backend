const express = require("express");
const router = express.Router();

const { AdminAuth } = require("../schemas/Auth");
const { OTP } = require("../models/OTP");
const messages = require("../config/messages");

router.get("/get-otp-list", AdminAuth, async (req, res) => {
  try {
    const otps = await OTP.find();
    return res.status(200).send({ OTPs: otps });
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const otp = await OTP.findOne({ _id: req.body._id });

    if (!otp) return res.status(401).send(expiredOTP);

    if (req.body.OTP.trim() !== otp.OTP)
      return res.status(401).send(messages.incorrectOTP);

    return res.send(messages.otpVerified);
  } catch (error) {
    return res.status(500).send(messages.serverError);
  }
});

module.exports = router;
