const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * @desc    Benutzerregistrierung mit Einladungscode (Benutzername)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits' 
      });
    }

    // Prüfen, ob ein Einladungscode (Benutzername) angegeben wurde und gültig ist
    let referredBy = null;
    if (inviteCode) {
      const referrer = await User.findOne({ username: inviteCode });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Ungültiger Einladungscode (Benutzername existiert nicht)'
        });
      }
      referredBy = referrer.username;
    } else {
      // Einladungscode ist erforderlich
      return res.status(400).json({
        success: false,
        message: 'Ein Einladungscode ist erforderlich'
      });
    }

    // Passwort hashen (obwohl das im User-Modell behandelt wird)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Neuen Benutzer erstellen
    const user = await User.create({
      username,
      email,
      password: hashedPassword, // Bereits gehasht
      referredBy
    });

    // Einladenden Benutzer aktualisieren
    if (referredBy) {
      const referrer = await User.findOne({ username: referredBy });
      
      // Eingeladenen Benutzer zur invitees-Liste hinzufügen
      if (!referrer.invitees.includes(user.username)) {
        referrer.invitees.push(user.username);
      }
      
      // Eingeladenen Benutzer zum Inner Circle hinzufügen, falls möglich
      if (referrer.innerCircle.length < 5) {
        referrer.innerCircle.push(user._id);
      }
      
      await referrer.save();
    }

    // JWT Token erstellen
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Antwort senden
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletBalance: user.walletBalance,
        invitees: user.invitees || [],
        referredBy: user.referredBy
      }
    });
  } catch (err) {
    console.error('Registrierungsfehler:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server-Fehler bei der Registrierung' 
    });
  }
};

/**
 * @desc    Benutzer einloggen
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Prüfen, ob E-Mail und Passwort angegeben wurden
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Bitte E-Mail und Passwort angeben'
      });
    }

    // Benutzer in der Datenbank suchen
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Zugangsdaten'
      });
    }

    // Passwort überprüfen
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Zugangsdaten'
      });
    }

    // JWT Token erstellen
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Antwort senden
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        invitees: user.invitees || [],
        referredBy: user.referredBy
      }
    });
  } catch (err) {
    console.error('Login-Fehler:', err);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Login'
    });
  }
}; 