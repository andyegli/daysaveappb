const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  // Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Match user
        const user = await User.findOne({ where: { email: email } });
        
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );

  // Google Strategy (only set up if credentials exist)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/users/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await User.findOne({ where: { googleId: profile.id } });
            
            if (user) {
              return done(null, user);
            }
            
            // Check if user exists with same email
            user = await User.findOne({ where: { email: profile.emails[0].value } });
            
            if (user) {
              // Update user with Google ID
              user.googleId = profile.id;
              await user.save();
              return done(null, user);
            }
            
            // Create new user
            const newUser = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              password: '' // No password for OAuth users
            });
            
            return done(null, newUser);
          } catch (err) {
            console.error(err);
            return done(err);
          }
        }
      )
    );
  }

  // Facebook Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/users/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Similar implementation as Google strategy
            let user = await User.findOne({ where: { facebookId: profile.id } });
            
            if (user) {
              return done(null, user);
            }
            
            if (profile.emails && profile.emails.length > 0) {
              user = await User.findOne({ where: { email: profile.emails[0].value } });
              
              if (user) {
                user.facebookId = profile.id;
                await user.save();
                return done(null, user);
              }
            }
            
            const newUser = await User.create({
              name: profile.displayName,
              email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
              facebookId: profile.id,
              password: ''
            });
            
            return done(null, newUser);
          } catch (err) {
            console.error(err);
            return done(err);
          }
        }
      )
    );
  }

  // Microsoft Strategy (similar pattern for other providers)
  // Twitter and Apple strategies would follow the same pattern

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};