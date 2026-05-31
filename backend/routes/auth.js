const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const dns = require('dns');
const { promisify } = require('util');
const resolveMx = promisify(dns.resolveMx);
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/email');

// Email & Password Registration (Step 1: Send OTP)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 1. Password validation (Basic)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // 2. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 3. MX Record Validation (DNS Check)
    const domain = email.split('@')[1];
    if (!domain) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({ error: 'Email domain does not exist or cannot receive emails' });
      }
    } catch (dnsError) {
      return res.status(400).json({ error: 'Invalid email domain' });
    }

    // 4. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otpCode, salt);

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    const otpDoc = new OTP({
      email,
      otp: hashedOTP
    });
    await otpDoc.save();

    // 5. Send OTP Email
    const emailSent = await sendOTPEmail(email, otpCode, name);
    if (!emailSent) {
      // If email sending failed (e.g., wrong credentials in .env), we can log the OTP for testing purposes
      console.log(`\n\n[DEV MODE] OTP for ${email} is: ${otpCode}\n\n`);
      // return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Registration/OTP error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Verify OTP & Complete Registration (Step 2)
router.post('/verify-otp', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!email || !otp || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find the latest OTP for this email
    const otpRecords = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    
    if (otpRecords.length === 0) {
      return res.status(400).json({ error: 'OTP has expired or was not requested. Please register again.' });
    }

    const validOTP = await bcrypt.compare(otp, otpRecords[0].otp);
    if (!validOTP) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // OTP is valid, create the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Delete used OTPs
    await OTP.deleteMany({ email });

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// Email & Password Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Please login using Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Fetch user info from Google using the access token
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Failed to fetch user from Google' });
    }

    const payload = await googleRes.json();
    
    // Check if user exists
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      // Create new user if not exists
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
      await user.save();
    }

    // Generate JWT for our app
    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

module.exports = router;
