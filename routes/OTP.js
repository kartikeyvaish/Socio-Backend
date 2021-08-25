const express = require("express");
const { random } = require("lodash");
const router = express.Router();
const moment = require("moment");

const config = require("../config/Configurations");
const { Helper } = require("../config/Helper");
const { CheckAdminAccess } = Helper;
const { OTP } = require("../models/OTP");

const TimeLimit = 10;

router.get("/get-otp-list", CheckAdminAccess, async (req, res) => {
  try {
    const otps = await OTP.find();
    return res.status(200).send({ OTPsCount: otps.length, OTPs: otps });
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/create-new-otp", async (req, res) => {
  try {
    if (req.body.Verification) {
      const createdAt = moment();
      const validTill = moment(createdAt).add(TimeLimit, "minutes");

      const newOtp = new OTP({
        Verification: req.body.Verification,
        CreatedAt: createdAt,
        ValidTill: validTill,
        OTP: random(100000, 999999),
      });

      await newOtp.save();

      return res.send(newOtp);
    }

    return res.status(404).send("Verification Details Needed");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-otp", CheckAdminAccess, async (req, res) => {
  try {
    const otp = await OTP.findOne({ _id: req.query._id });
    if (!otp) return res.status(404).send("OTP not Found or Maybe expired");

    await otp.delete();

    return res.send("OTP Deleted Successfully");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-all-otps", CheckAdminAccess, async (req, res) => {
  try {
    await OTP.deleteMany();
    return res.send("Success");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.delete("/delete-expired-otps", CheckAdminAccess, async (req, res) => {
  try {
    let now = moment();
    await OTP.deleteMany(
      {
        ValidTill: { $lte: now },
      },
      {},
      () => res.status(200).send("All Expired OTPs Deleted")
    );
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const otp = await OTP.findOne({ _id: req.body._id });

    if (!otp) return res.status(401).send("OTP is Expired");

    let now = moment();
    let validity = moment(otp.ValidTill);

    if (now.diff(validity, "minutes") > TimeLimit)
      return res.status(401).send("OTP is Expired");

    if (req.body.OTP.trim() !== otp.OTP)
      return res.status(401).send("You've entered an incorrect OTP");

    await otp.delete();

    return res.send("OTP Verification Success");
  } catch (error) {
    return res.status(500).send(config.messages.serverError);
  }
});

module.exports = router;
