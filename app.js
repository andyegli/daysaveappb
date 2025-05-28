const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const passport = require('passport');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Passport config
require('./config/passport')(passport);

// Database
const db = require('./config/database');

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Method override for PUT/DELETE requests
app.use(methodOverride('_method'));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Express session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/content', require('./routes/content'));

// Test DB connection, sync models, then start server
db.authenticate()
  .then(() => {
    console.log('Database connected...');
    return db.sync({ alter: true }); // Automatically create/update tables
  })
  .then(() => {
    console.log('Database synchronized!');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch(err => {
    console.error('Error during startup:', err);
  });
