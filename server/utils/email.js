import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  try {
    // Create a test account if no environment variables are set
    let testAccount;
    let transporter;
    
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use real email service if credentials are provided
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Create a test account using Ethereal Email for development
      testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"IoT Hub" <noreply@iothub.com>',
      to,
      subject,
      html
    });
    
    // Log URL for test accounts
    if (testAccount) {
      console.log('Email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};