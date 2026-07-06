const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

const defaultApiUrl = 'http://' + 'localhost' + ':5000';
const baseUrl = process.env.API_URL || defaultApiUrl;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseUrl}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google Strategy Callback reached');
        console.log('Profile:', profile ? profile.id : 'No profile');
        
        if (!profile || !profile.emails || !profile.emails[0]) {
            console.error('No email found in Google profile');
            return done(new Error('No email found'));
        }

        const email = profile.emails[0].value;
        console.log('Email:', email);

        let user = await User.findOne({ where: { email } });
        if (!user) {
          console.log('Creating new user for google auth');
          user = await User.create({
            email,
            name: profile.displayName,
            provider: 'google',
            passwordHash: null,
          });
        } else {
            console.log('User found:', user._id);
        }
        return done(null, user);
      } catch (err) {
        console.error('Google Auth Error:', err);
        return done(err);
      }
    }
  )
);

module.exports = passport;
