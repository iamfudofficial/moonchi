const express = require('express');
const { 
  mine, 
  getMiningStats, 
  getMiningHistory, 
  getInnerCircle 
} = require('../controllers/mining');

const router = express.Router();

// Alle Routen sind privat (durch Middleware im server.js)
router.post('/mine', mine);
router.get('/stats', getMiningStats);
router.get('/history', getMiningHistory);
router.get('/inner-circle', getInnerCircle);

module.exports = router; 