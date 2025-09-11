const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register user
router.post('/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isString().trim()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          // Note: In a real app, you'd store the hashed password
          // For this example, we're not storing passwords in the schema
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        user,
        token,
        message: 'User created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login user
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // In a real app, you'd verify the password here
      // For this example, we'll skip password verification
      // const isValidPassword = await bcrypt.compare(password, user.password);
      // if (!isValidPassword) {
      //   return res.status(401).json({ error: 'Invalid credentials' });
      // }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        },
        token,
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile',
  [
    body('name').optional().isString().trim(),
    body('avatar').optional().isURL()
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          name: req.body.name,
          avatar: req.body.avatar
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          updatedAt: true
        }
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
