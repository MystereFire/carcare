const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const User = require('../models/User');

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
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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

module.exports = router;
