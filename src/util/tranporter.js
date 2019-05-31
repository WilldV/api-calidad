const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: "Disponibilidad-docente",
    pass: "aulafisi2018"
  }
});

module.exports = transporter