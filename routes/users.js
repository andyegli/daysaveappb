const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// Login Page
router.get('/login', (req, res) => res.render('users/login', {
  title: 'Login'
}));

// Register Page
router.get('/register', (req, res) => res.render('users/register', {
  title: 'Register'
}));

// Register Handle
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('users/register', {
      title: 'Register',
      errors: errors.array(),
      name: req.body.name,
      email: req.body.email
    });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      return res.render('users/register', {
        title: 'Register',
        errors: [{ msg: 'Email already registered' }],
        name,
        email
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    res.render('users/register', {
      title: 'Register',
      errors: [{ msg: 'Server error' }],
      name,
      email
    });
  }
});

// Login Handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

// Google auth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/users/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Facebook auth
router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Facebook callback
router.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/users/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Twitter auth
router.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter callback
router.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/users/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Microsoft auth
router.get('/auth/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

// Microsoft callback
router.get('/auth/microsoft/callback', 
  passport.authenticate('microsoft', { failureRedirect: '/users/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Apple auth
router.get('/auth/apple', passport.authenticate('apple'));

// Apple callback
router.get('/auth/apple/callback', 
  passport.authenticate('apple', { failureRedirect: '/users/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

// Forgot password
router.get('/forgot', (req, res) => {
  res.render('users/forgot', {
    title: 'Forgot Password'
  });
});

router.post('/forgot', async (req, res) => {
  try {
    const token = crypto.randomBytes(20).toString('hex');
    
    const user = await User.findOne({ where: { email: req.body.email } });
    
    if (!user) {
      req.flash('error_msg', 'No account with that email address exists');
      return res.redirect('/users/forgot');
    }
    
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // In a real app, you would send an email with the token
    // Here we'll just flash a message with the reset URL
    const resetUrl = `http://${req.headers.host}/users/reset/${token}`;
    req.flash('success_msg', `Password reset link: ${resetUrl}`);
    res.redirect('/users/forgot');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred');
    res.redirect('/users/forgot');
  }
});

// Reset password
router.get('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });
    
    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired');
      return res.redirect('/users/forgot');
    }
    
    res.render('users/reset', {
      title: 'Reset Password',
      token: req.params.token
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred');
    res.redirect('/users/forgot');
  }
});

router.post('/reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { [require('sequelize').Op.gt]: Date.now() }
      }
    });
    
    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired');
      return res.redirect('/users/forgot');
    }
    
    if (req.body.password !== req.body.confirm) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('back');
    }
    
    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    req.flash('success_msg', 'Password has been reset');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred');
    res.redirect('/users/reset/' + req.params.token);
  }
});

module.exports = router;