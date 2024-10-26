const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./routes/passport'); // Import passport configuration
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const apiRoutes = require('./routes/api');  // Import the api.js as a route
const path = require('path');
const ensureAuthenticated = require('./routes/ensureAuthenticated');
const createStoryRoutes = require('./routes/createStoryRoutes');
const collectionRoutes = require('./routes/collection');
const publishRoutes = require('./routes/publish');
const likeRoutes = require('./routes/like');
const saveRoutes = require('./routes/save');
const commentRoutes = require('./routes/comment');
const profileRoutes = require('./routes/profile');
const deleteRoutes = require('./routes/delete');
const toggleSave = require('./routes/toggleSave');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3001;
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Account';

// Create a connection to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/create-story', ensureAuthenticated, createStoryRoutes);
app.use(express.static('public'));



// Session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,
    stringify: false
  }),
  cookie: { secure: false }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use('/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files
app.use('/files', uploadRoutes); // Use the upload route
app.use('/api', apiRoutes);  // Use the API routes
app.use('/collection', collectionRoutes);
app.use('/api', publishRoutes);
app.use('/api', likeRoutes);
app.use('/api', saveRoutes);
app.use('/api', commentRoutes);
app.use('/api', profileRoutes);
app.use('/delete', deleteRoutes);
app.use('/toggle', toggleSave);
app.use('/search', searchRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Back-end server is running on http://localhost:${PORT}`);
});
