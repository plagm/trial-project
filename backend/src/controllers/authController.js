import argon2 from 'argon2';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  businessName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerUser = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name, businessName } = validatedData;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await argon2.hash(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      email,
      passwordHash,
      name,
      businessName,
      verificationToken: hashedToken
    });

    if (user) {
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
      
      try {
        await sendEmail({
          to: user.email,
          subject: 'InvoiceLoop - Verify your Email',
          text: `Please verify your email by clicking on this link: ${verifyUrl}`
        });
      } catch (err) {
        console.error('Failed to send verification email', err);
      }

      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await User.findOne({ email });

    if (user && (await argon2.verify(user.passwordHash, password))) {
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email before logging in.' });
      }
      generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ verificationToken: hashedToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'InvoiceLoop - Password Reset Request',
        text: `You requested a password reset. Please go to this link: ${resetUrl}`
      });
      res.json({ message: 'Email sent' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await argon2.hash(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    const googleClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : '';
    const client = new OAuth2Client(googleClientId);

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, aud } = payload;
    console.log('--- Google Login Debug ---');
    console.log('Frontend sent token for audience (aud):', aud);
    console.log('Backend expected audience (googleClientId):', googleClientId);
    console.log('Are they equal?', aud === googleClientId);
    console.log('--------------------------');
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists but doesn't have a googleId, update it
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Google emails are verified
        await user.save();
      }
    } else {
      // Create a new user
      user = await User.create({
        email,
        name,
        googleId,
        isVerified: true
      });
    }
    
    generateToken(res, user._id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
    });
  } catch (error) {
    console.error('Google login error details:');
    console.log('googleClientId on backend is:', `"${process.env.GOOGLE_CLIENT_ID}"`);
    console.log('Error message:', error.message);
    res.status(401).json({ message: 'Invalid Google credential: ' + error.message });
  }
};
