// const sgMail = require("@sendgrid/mail");
// const dotenv = require("dotenv");
// dotenv.config({ path: "../config.env" });
// sgMail.setApiKey(process.env.SG_KEY);

// const sendSGMail = async ({
//   recipient,
//   sender,
//   subject,
//   html,
//   text,
//   attachments,
// }) => {
//   try {
//     const from = sender || "niladri.adak03@gmail.com";

//     const msg = {
//       to: recipient, //email of recipient
//       from: from, // this will be verifiend sender
//       subject: subject,
//       html: html,
//       text: text,
//       attachments,
//     };
//     return sgMail.send(msg);
//   } catch (e) {
//     console.log(e);
//   }
// };

// exports.sendEmail = async (args) => {
//   if (process.env.NODE_ENV === "development") {
//     return new Promise.resolve();
//   } else {
//     return sendSGMail(args);
//   }
// };

const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

const mailSender = async (email, title, body) => {
  console.log("from mailer", email);
  console.log("Credentials", process.env.MAIL_HOST);
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "StudyNotion ||  -by Niladri",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
    console.log(info);
    return info;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = mailSender;
