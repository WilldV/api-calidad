const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: "fisi-unmsm",
    pass: "will456123"
  }
});

module.exports = transporter