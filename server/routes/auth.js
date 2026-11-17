const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { User, sequelize } = require('../models');
const passport = require('passport');
const { loadRuntimeConfig } = require('../config/runtime');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user profile
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isString().bail().trim().toLowerCase().isEmail().isLength({ max: 254 }).withMessage('Adresse e-mail invalide'),
    body('password').isString().bail().isLength({ min: 8 }).custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Le mot de passe doit contenir au moins 8 caractères et au plus 72 octets'),
    body('name').isString().bail().trim().notEmpty().isLength({ max: 255 }).withMessage('Le nom est requis'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Ensure the email is not already registered
      if (await User.findOne({ where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), email) })) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Hash password and store the user
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ email, passwordHash, name });
      res.status(201).json({ message: 'User created' });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Email already in use' });
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
  [body('email').isString().bail().trim().toLowerCase().isEmail(), body('password').isString().bail().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), email) });

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
    if (!user) return res.status(401).json({ error: 'Session invalide' });
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
    body('currentPassword').isString().bail().notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isString().bail()
      .isLength({ min: 8 })
      .custom(value => Buffer.byteLength(value, 'utf8') <= 72)
      .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères et au plus 72 octets'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user._id);

      // Verify current password strength
      if (!user) return res.status(401).json({ error: 'Session invalide' });
      if (!user.passwordHash) return res.status(400).json({ error: 'Ce compte utilise la connexion Google.' });
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

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
  (req, res, next) => !loadRuntimeConfig().googleEnabled ? res.status(503).json({ error: 'La connexion Google n’est pas configurée.' }) : next(),
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth2.0 callback URL to generate JWT token and redirect to frontend
 * @access  Public
 */
router.get(
  '/google/callback',
  (req, res, next) => !loadRuntimeConfig().googleEnabled ? res.status(503).json({ error: 'La connexion Google n’est pas configurée.' }) : next(),
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const { frontendUrl } = loadRuntimeConfig();
    res.redirect(`${frontendUrl}/oauth2?token=${token}`);
  }
);

module.exports = router;
