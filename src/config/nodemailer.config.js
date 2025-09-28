const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport(
  {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  { from: "Support <support@guardian.com>" },
);

module.exports = mailTransporter;
