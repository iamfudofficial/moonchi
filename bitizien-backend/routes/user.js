const express = require('express');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Aktuelles Benutzerprofil abrufen
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    // Benutzer mit Inner Circle-Benutzern abrufen
    const user = await req.user
      .populate('innerCircle', 'username email')
      .execPopulate();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        miningRate: user.miningRate,
        miningBoost: user.miningBoost,
        referredBy: user.referredBy,
        invitees: user.invitees || [],
        innerCircle: user.innerCircle,
        lastMiningTime: user.lastMiningTime,
        createdAt: user.createdAt,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerprofils:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Abrufen des Benutzerprofils'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Benutzerprofil aktualisieren
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { username } = req.body;

    // Prüfen, ob der Benutzername bereits existiert (außer für den aktuellen Benutzer)
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Dieser Benutzername ist bereits vergeben'
        });
      }
    }

    // Aktualisiere nur erlaubte Felder
    const fieldsToUpdate = {
      username
    };

    // Entferne leere Felder
    Object.keys(fieldsToUpdate).forEach(key => {
      if (!fieldsToUpdate[key]) delete fieldsToUpdate[key];
    });

    // Benutzer aktualisieren
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzerprofils:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Aktualisieren des Benutzerprofils'
    });
  }
});

// @route   GET /api/users/referral
// @desc    Referral-Informationen abrufen
// @access  Private
router.get('/referral', async (req, res) => {
  try {
    // Benutzer mit von ihm eingeladenen Benutzern abrufen (über invitees-Array)
    const user = await User.findById(req.user._id);
    
    // Alle eingeladenen Benutzer abrufen
    const referrals = await User.find({ 
      username: { $in: user.invitees } 
    }).select('username createdAt');

    res.status(200).json({
      success: true,
      count: referrals.length,
      data: {
        inviteCode: user.username, // Der Benutzername ist jetzt der Einladungscode
        referrals
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Referral-Informationen:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Abrufen der Referral-Informationen'
    });
  }
});

module.exports = router; 