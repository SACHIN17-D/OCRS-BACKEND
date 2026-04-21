const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value.toLowerCase();

    // Check if user already exists in DB
    let user = await User.findOne({ email });

    if (user) {
      // Check if account is deactivated
      if (!user.isActive) {
        return done(null, false, { message: 'deactivated' });
      }
      // User exists → allow login with their existing role
      return done(null, user);
    }

    // New user
    if (email.endsWith('@ocrs.edu')) {
      // College email — auto detect role
      const localPart = email.split('@')[0];
      const role = localPart.includes('.') ? 'student' : 'reporter';
      const rollNo = role === 'student' ? localPart.toUpperCase() : null;

      user = await User.create({
        name: profile.displayName,
        email,
        password: Math.random().toString(36),
        role,
        rollNo,
        department: 'Not Assigned',
      });
    } else {
      // Personal Gmail → create as reporter
      user = await User.create({
        name: profile.displayName,
        email,
        password: Math.random().toString(36),
        role: 'reporter',
        department: 'Not Assigned',
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;