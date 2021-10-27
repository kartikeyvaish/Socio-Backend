const Email = require("email-templates");
const nodemailer = require("nodemailer");

const messages = require("../config/messages");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.password,
  },
});

const Mailer = new Email({
  transport: transporter,
  preview: false,
  send: true,
});

async function SendOTPEmail({ to = "", subject = "", locals = {} }) {
  try {
    const response = await Mailer.send({
      template: "OTP",
      message: {
        to: to,
        from: `Socio <${process.env.email}>`,
        subject: subject,
      },
      locals: locals,
    });

    return { response: "Email Sent Successfully", ok: true, data: response };
  } catch (error) {
    return { response: messages.serverError, ok: false };
  }
}

exports.SendOTPEmail = SendOTPEmail;
