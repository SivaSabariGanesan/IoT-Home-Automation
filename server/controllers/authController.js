import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      fullName,
      email,
      password
    });
    
    // Generate OTP
    const otp = user.generateOTP();
    
    await user.save();
    
    // Send OTP email
    const emailSubject = 'Verify Your Email';
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #312E81 0%, #4338CA 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .otp-container { padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); border: 1px solid #e5e7eb; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .otp-code { margin: 0; letter-spacing: 8px; font-size: 32px; color: #312E81; font-weight: bold; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4338CA 0%, #312E81 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container animate-fade-in">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Welcome to IoT Hub</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Smart Device Management Platform</p>
          </div>
          <div class="content">
            <h2 style="color: #312E81; margin-bottom: 20px;">Verify Your Email</h2>
            <p>Hi ${fullName},</p>
            <p>Welcome to IoT Hub! To complete your registration and start managing your IoT devices, please use the following verification code:</p>
            <div class="otp-container">
              <h2 class="otp-code">${otp}</h2>
              <p style="margin: 10px 0 0 0; color: #6b7280;">This code will expire in 10 minutes</p>
            </div>
            <p style="margin-top: 20px;">If you didn't request this verification, please ignore this email.</p>
            <a href="#" class="button">Visit IoT Hub</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} IoT Hub. All rights reserved.</p>
            <p style="margin-top: 10px;">Secure • Reliable • Connected</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(email, emailSubject, emailBody);
    
    res.status(201).json({ message: 'User registered. Check your email for OTP verification.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify OTP
    if (user.verifyOTP(otp)) {
      user.isVerified = true;
      user.otp = undefined;
      await user.save();
      
      // Generate JWT token
      const token = generateToken(user._id);
      
      res.status(200).json({
        message: 'Email verified successfully',
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate OTP
    const otp = user.generateOTP();
    
    await user.save();
    
    // Send OTP email
    const emailSubject = 'Reset Your Password';
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #312E81 0%, #4338CA 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .otp-container { padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); border: 1px solid #e5e7eb; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .otp-code { margin: 0; letter-spacing: 8px; font-size: 32px; color: #312E81; font-weight: bold; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4338CA 0%, #312E81 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container animate-fade-in">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">IoT Hub Password Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure Account Recovery</p>
          </div>
          <div class="content">
            <h2 style="color: #312E81; margin-bottom: 20px;">Reset Your Password</h2>
            <p>Hi ${user.fullName},</p>
            <p>We received a request to reset your password. Use the following verification code to complete the process:</p>
            <div class="otp-container">
              <h2 class="otp-code">${otp}</h2>
              <p style="margin: 10px 0 0 0; color: #6b7280;">This code will expire in 10 minutes</p>
            </div>
            <p style="margin-top: 20px;">If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            <a href="#" class="button">Visit IoT Hub</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} IoT Hub. All rights reserved.</p>
            <p style="margin-top: 10px;">Secure • Reliable • Connected</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(email, emailSubject, emailBody);
    
    res.status(200).json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify OTP
    if (user.verifyOTP(otp)) {
      user.password = newPassword;
      user.otp = undefined;
      await user.save();
      
      res.status(200).json({ message: 'Password reset successful' });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate new OTP
    const otp = user.generateOTP();
    
    await user.save();
    
    // Send OTP email
    const emailSubject = 'Your New Verification Code';
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #312E81 0%, #4338CA 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .otp-container { padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%); border: 1px solid #e5e7eb; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .otp-code { margin: 0; letter-spacing: 8px; font-size: 32px; color: #312E81; font-weight: bold; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4338CA 0%, #312E81 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container animate-fade-in">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">New Verification Code</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">IoT Hub Account Verification</p>
          </div>
          <div class="content">
            <h2 style="color: #312E81; margin-bottom: 20px;">Your New Verification Code</h2>
            <p>Hi ${user.fullName},</p>
            <p>As requested, here is your new verification code:</p>
            <div class="otp-container">
              <h2 class="otp-code">${otp}</h2>
              <p style="margin: 10px 0 0 0; color: #6b7280;">This code will expire in 10 minutes</p>
            </div>
            <p style="margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
            <a href="#" class="button">Visit IoT Hub</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} IoT Hub. All rights reserved.</p>
            <p style="margin-top: 10px;">Secure • Reliable • Connected</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendEmail(email, emailSubject, emailBody);
    
    res.status(200).json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};