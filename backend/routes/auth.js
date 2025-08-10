const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const User = require('../models/User');
const passport = require('passport');

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
    body('name').notEmpty().withMessage('Nom requis'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
      if (await User.findOne({ email })) {
        return res.status(409).json({ error: 'Email d\u00e9j\u00e0 utilis\u00e9' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({ email, passwordHash, name });
      await user.save();
      res.status(201).json({ message: 'User created' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (
        !user ||
        user.provider === 'google' ||
        !user.passwordHash ||
        !(await bcrypt.compare(password, user.passwordHash))
      ) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// Récupère les informations du profil de l'utilisateur connecté
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Modification du mot de passe
router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Nouveau mot de passe trop court'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();
      res.json({ message: 'Mot de passe modifié' });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.redirect(`${process.env.FRONTEND_URL}/oauth2?token=${token}`);
  }
);

module.exports = router;
