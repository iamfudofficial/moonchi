const User = require('../models/User');
const MiningEvent = require('../models/MiningEvent');
const { mineForUser } = require('../utils/miningEngine');

// @desc    Mining für den aktuellen Benutzer starten
// @route   POST /api/mining/mine
// @access  Private
exports.mine = async (req, res) => {
  try {
    console.log('Mining-Anfrage von Benutzer:', req.user.id);
    const result = await mineForUser(req.user.id);
    
    console.log('Mining-Ergebnis:', result);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Mining-Fehler:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Fehler beim Mining-Prozess'
    });
  }
};

// @desc    Mining-Statistik für den aktuellen Benutzer abrufen
// @route   GET /api/mining/stats
// @access  Private
exports.getMiningStats = async (req, res) => {
  try {
    console.log('Mining-Statistik angefordert für Benutzer:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.error('Benutzer nicht gefunden:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }
    
    // Berechne die aktuelle Mining-Rate
    const miningRate = await user.calculateMiningRate();
    
    // Berechne die Zeit bis zum nächsten Mining
    const lastMiningTime = new Date(user.lastMiningTime).getTime();
    const currentTime = Date.now();
    const miningInterval = process.env.MINING_INTERVAL || 3600000; // 1 Stunde in Millisekunden
    
    const timeSinceLastMining = currentTime - lastMiningTime;
    const timeUntilNextMining = Math.max(0, miningInterval - timeSinceLastMining);
    
    // Konvertiere in Minuten für bessere Lesbarkeit
    const minutesUntilNextMining = Math.ceil(timeUntilNextMining / 60000);
    
    const result = {
      walletBalance: user.walletBalance || 0,
      miningRate,
      innerCircleCount: user.innerCircle.length,
      innerCircleBonus: user.innerCircle.length * 0.2, // 20% pro aktivem Nutzer
      miningBoost: user.miningBoost || 1,
      lastMiningTime: user.lastMiningTime,
      canMineNow: timeUntilNextMining <= 0,
      timeUntilNextMining: minutesUntilNextMining
    };
    
    console.log('Mining-Statistik erstellt:', result);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Mining-Statistik:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Abrufen der Mining-Statistik'
    });
  }
};

// @desc    Mining-Verlauf für den aktuellen Benutzer abrufen
// @route   GET /api/mining/history
// @access  Private
exports.getMiningHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Mining-Events des Benutzers abrufen
    const events = await MiningEvent.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Gesamtanzahl der Events für Pagination
    const total = await MiningEvent.countDocuments({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      },
      data: events
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Mining-Verlaufs:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Abrufen des Mining-Verlaufs'
    });
  }
};

// @desc    Inner Circle des aktuellen Benutzers abrufen
// @route   GET /api/mining/inner-circle
// @access  Private
exports.getInnerCircle = async (req, res) => {
  try {
    console.log('Inner Circle angefordert für Benutzer:', req.user.id);
    
    const user = await User.findById(req.user.id).populate('innerCircle', 'username email');
    
    if (!user) {
      console.error('Benutzer nicht gefunden:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }
    
    console.log('Inner Circle gefunden mit', user.innerCircle.length, 'Mitgliedern');
    
    res.status(200).json({
      success: true,
      count: user.innerCircle.length,
      maxCount: 5,
      data: user.innerCircle
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Inner Circle:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Abrufen des Inner Circle'
    });
  }
}; 