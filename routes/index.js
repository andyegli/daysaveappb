const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Welcome page
router.get('/', (req, res) => res.render('landing', {
  title: 'Welcome to Social Content CMS',
  user: req.user
}));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    user: req.user
  });
});

module.exports = router;