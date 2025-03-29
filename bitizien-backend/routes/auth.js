const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Öffentliche Routen
router.post('/register', register);
router.post('/login', login);

// Geschützte Routen
router.get('/me', authenticateToken, getMe);

module.exports = router; 