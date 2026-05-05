const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_app_password'
  }
});

function sendAlert(message) {
  transporter.sendMail({
    from: 'your_email@gmail.com',
    to: 'your_email@gmail.com',
    subject: '🚨 Build Alert',
    text: message
  });
}