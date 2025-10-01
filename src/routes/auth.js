const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('company').optional()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];

// POST /api/auth/signup - Create new user account
router.post('/signup', validateSignup, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, full_name, company } = req.body;

    const result = await authService.createUser({
      email,
      password,
      full_name,
      company
    });

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Signup failed:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/login - Authenticate user
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    const result = await authService.authenticateUser(email, password);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Login failed:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authService.requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/settings - Save user settings
router.post('/settings', authService.requireAuth, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;
    
    const result = await authService.saveUserSettings(userId, settings);
    
    res.json({
      success: true,
      data: result,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Save settings failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/auth/settings - Get user settings
router.get('/settings', authService.requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await authService.getUserSettings(userId);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/test - Test authentication service
router.post('/test', async (req, res) => {
  try {
    const result = await authService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/auth/status - Get authentication status and user count
router.get('/status', async (req, res) => {
  try {
    const connectionTest = await authService.testConnection();

    res.json({
      success: connectionTest.success,
      database_type: connectionTest.database_type,
      user_count: connectionTest.user_count,
      message: connectionTest.message
    });

  } catch (error) {
    res.json({
      success: false,
      database_type: 'none',
      user_count: 0,
      error: error.message
    });
  }
});

module.exports = router; 