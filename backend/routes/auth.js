const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { User } = require('../models');
const passport = require('passport');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user profile
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      
      // Ensure the email is not already registered
      if (await User.findOne({ where: { email } })) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      
      // Hash password and store the user
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ email, passwordHash, name });
      res.status(201).json({ message: 'User created' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and acquire a JWT session token
 * @access  Public
 */
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      
      // Check credentials validity (preventing password comparisons on Google Auth users)
      if (
        !user ||
        user.provider === 'google' ||
        !user.passwordHash ||
        !(await bcrypt.compare(password, user.passwordHash))
      ) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate a JWT session token valid for 1 hour
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details (excluding password hash)
 * @access  Private
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user._id, {
      attributes: { exclude: ['passwordHash'] },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/auth/password
 * @desc    Update password for the logged-in user
 * @access  Private
 */
router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user._id);

      // Verify current password strength
      if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }

      // Hash the new password and save
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();
      res.json({ message: 'Mot de passe modifié' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Passport Google OAuth2.0 authentication flow
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth2.0 callback URL to generate JWT token and redirect to frontend
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const defaultFrontendUrl = 'http://' + 'localhost' + ':5173';
    const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
    res.redirect(`${frontendUrl}/oauth2?token=${token}`);
  }
);

module.exports = router;
