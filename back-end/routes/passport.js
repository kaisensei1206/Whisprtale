const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');

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
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      if (!user.profilePicture && profile.photos.length) {
        user.profilePicture = profile.photos[0].value;
        await user.save();
      }
      return done(null, user);
    }

    if (profile.emails && profile.emails.length) {
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        user.profilePicture = profile.photos[0].value;
        await user.save();
        return done(null, user);
      }
    }

    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      account: profile.displayName,
      profilePicture: profile.photos.length ? profile.photos[0].value : null,
    });
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
