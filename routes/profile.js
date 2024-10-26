const express = require('express');
const router = express.Router();
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const mongoose = require('mongoose');
const uploadRouter = require('./upload');
const upload = multer(); // This stores the file in memory and parses form fields
const { Readable } = require('stream');
const crypto = require('crypto');



mongoose.set('debug', true);  // Enable Mongoose debugging

// Initialize GridFS
const conn = mongoose.createConnection('mongodb://localhost:27017/Account', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gridfsBucket;
conn.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads',
  });
});

router.use('/upload', uploadRouter);

router.get('/profile', async (req, res) => {
  try {
    const statusResponse = await axios.get('http://localhost:3001/auth/status', {
      headers: { ...req.headers },
      withCredentials: true
    });

    if (!statusResponse.data.isLoggedIn) {
      return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const userId = statusResponse.data.user.userId;
    console.log('Retrieved userId:', userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found in database:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = {
      account: user.account || '',
      email: user.email || '',
      realname: user.realname || '',
      bday: user.bday || '',
      phoneNumber: user.phoneNumber || '',
      profilePicture: user.profilePicture || ''
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/profile_edit', async (req, res) => {
  try {
    const userId = req.body.userId;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    const objectId = new mongoose.Types.ObjectId(userId);

    // Prepare the fields to update, filtering out null or empty values
    const updateFields = {};
    if (req.body.username) updateFields.account = req.body.username;
    if (req.body.realname) updateFields.realname = req.body.realname;
    if (req.body.phoneNumber) updateFields.phoneNumber = req.body.phoneNumber;
    if (req.body.bday) updateFields.bday = new Date(req.body.bday);

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ success: true, message: 'No changes detected, nothing was updated' });
    }

    // Perform the update
    const saveResult = await mongoose.connection.collection('users').updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    if (saveResult.modifiedCount > 0) {
      const updatedUser = await mongoose.connection.collection('users').findOne({ _id: objectId });
      return res.json({ success: true, message: 'Profile updated successfully', updatedUser });
    } else {
      return res.status(200).json({ success: true, message: 'No changes detected, nothing was updated' });
    }

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



router.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    const objectId = new mongoose.Types.ObjectId(userId.trim());
    const user = await User.findById(objectId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const filename = `${crypto.randomBytes(16).toString('hex')}${path.extname(req.file.originalname)}`;
    const readableStream = Readable.from(req.file.buffer);
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
    });

    readableStream.pipe(uploadStream)
      .on('error', (err) => {
        console.error('Error uploading file:', err);
        return res.status(500).json({ message: 'Failed to upload profile picture' });
      })
      .on('finish', async () => {
        user.profilePicture = uploadStream.id;
        await user.save();
        res.status(201).json({ success: true, newProfilePictureUrl: `http://localhost:3001/auth/image/${uploadStream.id}` });
      });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
module.exports = router;
