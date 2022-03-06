// Packages Imports
import Email from "email-templates";
import nodemailer from "nodemailer";

// Local imports
import messages from "../config/messages";

// defined the transporter object
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.email,
        pass: process.env.password,
    },
});

// initialize mailer instance
const Mailer = new Email({
    transport: transporter,
    preview: false,
    send: true,
});

// function to send email to user using OTP template
export async function SendOTPEmail({ to = "", subject = "", locals = {} }) {
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
