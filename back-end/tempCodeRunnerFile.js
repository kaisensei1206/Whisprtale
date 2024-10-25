const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const { MongoClient, GridFSBucket } = require('mongodb');
const multer = require('multer');
const MongoStore = require('connect-mongo');
const crypto = require('crypto');
const path = require('path');
const { Readable } = require('stream');
const authRoutes = require('./routes/auth');
const User = require('./models/user');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;

// MongoDB URI
const mongoURI = 'mongodb://localhost:27017/Account';

// Create a connection to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'your_secret_key', // Replace with a secure secret
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }), // Use MongoDB to store sessions
  cookie: { secure: false } // Set secure: true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  try {
    const user = await User.findOne({ $or: [{ email: account }, { account }] });

    if (!user) {
      return done(null, false, { message: 'Incorrect account or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return done(null, false, { message: 'Incorrect account or password' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Passport Google Strategy
passport.use(new GoogleStrategy({
  clientID: '67194094732-d6sj9igmjm3rkagjcn1ubpoe3nupho0k.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3001/auth/google/callback',
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if the email already exists in the database
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Merge accounts: add googleId and profilePicture to existing user
        user.googleId = profile.id;
        user.profilePicture = profile.photos[0].value;
        await user.save();
        return done(null, user);
      }

      // Create a new user
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        account: profile.displayName,
        profilePicture: profile.photos[0].value,
      });
      await user.save();
      return done(null, user);

    } catch (err) {
      return done(err, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Use routes
app.use('/auth', authRoutes);

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle file uploads using GridFSBucket
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('profilePicture'), async (req, res) => {
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

// Start the server
app.listen(PORT, () => {
  console.log(`Back-end server is running on http://localhost:${PORT}`);
});