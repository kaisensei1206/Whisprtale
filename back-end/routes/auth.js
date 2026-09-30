const express = require('express');
const router = express.Router();
const passport = require('./passport');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const { Readable } = require('stream');
const User = require('../models/user');

const upload = multer({ storage: multer.memoryStorage() });
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Profile pictures live in the same GridFS bucket used by profile.js
function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
}

function saveToGridFS(file) {
  return new Promise((resolve, reject) => {
    const filename = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname || '.jpg')}`;
    const uploadStream = getBucket().openUploadStream(filename, { contentType: file.mimetype });
    Readable.from(file.buffer)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id.toString()));
  });
}

// Check whether an email or account name is already taken
router.post('/check-existence', async (req, res) => {
  const { field, value } = req.body;
  if (!['email', 'account'].includes(field) || typeof value !== 'string') {
    return res.status(400).json({ message: 'Invalid field' });
  }
  try {
    const exists = await User.exists({ [field]: value });
    res.json({ exists: !!exists });
  } catch (err) {
    console.error('Error checking existence:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register a new local account (multipart form with optional profilePicture)
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  const { email, account, password } = req.body;
  if (!email || !account || !password) {
    return res.status(400).json({ message: 'Email, account and password are required' });
  }
  try {
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'This email already exists' });
    }
    if (await User.exists({ account })) {
      return res.status(409).json({ message: 'This username already exists' });
    }

    const user = new User({
      email,
      account,
      password: await bcrypt.hash(password, 10),
      profilePicture: req.file ? await saveToGridFS(req.file) : undefined,
    });
    await user.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Local login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.json({ message: (info && info.message) || 'Incorrect account or password' });
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({ message: 'Login successful', redirectUrl: `${FRONTEND_URL}/index.html` });
    });
  })(req, res, next);
});

// ensureAuthenticated redirects here for unauthenticated requests
router.get('/login', (req, res) => {
  res.redirect(`${FRONTEND_URL}/login.html`);
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login.html` }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/index.html`);
  }
);

// Current login status
router.get('/status', (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.json({ isLoggedIn: false });
  }
  const user = req.user;
  res.json({
    isLoggedIn: true,
    user: {
      userId: user._id.toString(),
      account: user.account,
      email: user.email,
      profilePicture: user.profilePicture ? String(user.profilePicture) : null,
    },
  });
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful', redirectUrl: `${FRONTEND_URL}/index.html` });
    });
  });
});

// Serve a profile picture from GridFS by file id
router.get('/image/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid image id' });
  }
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const files = await getBucket().find({ _id: id }).toArray();
    if (!files.length) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.set('Content-Type', files[0].contentType || 'image/jpeg');
    getBucket().openDownloadStream(id).pipe(res);
  } catch (err) {
    console.error('Error fetching image:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
