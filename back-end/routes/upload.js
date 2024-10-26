const express = require('express');
const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
const { Readable } = require('stream');

const router = express.Router();

const mongoURI = 'mongodb://localhost:27017/Account';
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle file uploads using GridFSBucket
router.post('/upload', upload.single('profilePicture'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const client = await MongoClient.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db();
    const bucket = new GridFSBucket(db, {
      bucketName: 'uploads'
    });

    const filename = `${crypto.randomBytes(16).toString('hex')}${path.extname(req.file.originalname)}`;
    const readableStream = Readable.from(req.file.buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
    });

    readableStream.pipe(uploadStream)
      .on('error', (err) => {
        console.error('Error uploading file:', err);
        res.status(500).json({ message: 'Failed to upload file' });
      })
      .on('finish', () => {
        res.status(201).json({ fileId: uploadStream.id, filename: uploadStream.filename, message: 'File uploaded successfully' });
        client.close(); // Close the client connection after the file is uploaded
      });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
