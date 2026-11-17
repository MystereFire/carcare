const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, sequelize } = require('../models');
const { loadRuntimeConfig } = require('./runtime');
const config = loadRuntimeConfig();

if (config.googleEnabled) passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${config.apiUrl}/api/auth/google/callback`,
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        if (!profile || !profile.emails || !profile.emails[0]) {
            console.error('No email found in Google profile');
            return done(new Error('No email found'));
        }

        if (profile._json?.email_verified !== true && profile.emails[0].verified !== true) return done(new Error('Adresse Google non vérifiée'));
        const email = profile.emails[0].value.trim().toLowerCase();

        let user = await User.findOne({ where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), email) });
        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName,
            provider: 'google',
            passwordHash: null,
          });
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
