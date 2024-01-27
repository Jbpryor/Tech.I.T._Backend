require('dotenv').config();
const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const emailTempPass = async (email, temporaryPassword) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: 'Temporary Password',
    text: `Your temporary password is: ${temporaryPassword}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, message: 'Temporary password sent to email' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to send email' };
  }
};

module.exports = emailTempPass;
