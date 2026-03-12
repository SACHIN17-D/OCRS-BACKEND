const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

const detectRole = (email) => {
  // College email - auto detect
  if (email.endsWith('@bitsathy.ac.in')) {
    const localPart = email.split('@')[0];
    return localPart.includes('.') ? 'student' : 'reporter';
  }

  // Allowed personal Gmails for testing
  const allowedReporters = ['sachinmiraclemaker@gmail.com'];
  if (allowedReporters.includes(email)) return 'reporter';

  // Block everything else
  return null;
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value.toLowerCase();
    const role = detectRole(email);

    if (!role) {
      return done(null, false, { message: 'Unauthorized email.' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const rollNo = role === 'student'
        ? email.split('@')[0].toUpperCase()
        : null;

      user = await User.create({
        name: profile.displayName,
        email,
        password: Math.random().toString(36),
        role,
        rollNo,
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