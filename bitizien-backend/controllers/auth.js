const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper-Funktion für Token-Erstellung und Antwort
const sendTokenResponse = (user, statusCode, res) => {
  // Token erstellen
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  // Konsole für Debugging
  console.log('Sende Token-Antwort:', { token, user: user._id.toString() });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      walletBalance: user.walletBalance || 0,
      invitees: user.invitees || [],
      referredBy: user.referredBy || null
    }
  });
};

// @desc    Benutzer registrieren
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, inviteCode } = req.body;
    
    console.log('Registrierungsanfrage erhalten:', { username, email, inviteCode: inviteCode || 'keine' });

    // Prüfen, ob Benutzer bereits existiert
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      console.error('Registrierung fehlgeschlagen: Benutzer existiert bereits', { 
        email, 
        username, 
        existingEmail: existingUser.email, 
        existingUsername: existingUser.username 
      });
      
      return res.status(400).json({
        success: false,
        message: 'Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits'
      });
    }

    // Prüfen, ob es bereits Benutzer in der Datenbank gibt
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    
    console.log('Benutzeranzahl in der Datenbank:', userCount);

    // Einladungscode-Logik
    let referredBy = null;
    
    // Wenn es der erste Benutzer ist, überspringen wir die Einladungscode-Prüfung
    if (isFirstUser) {
      // Für den ersten Benutzer ist kein Einladungscode erforderlich
      console.log('Erster Benutzer wird registriert - kein Einladungscode erforderlich');
    } 
    // Wenn ein Einladungscode angegeben wurde, prüfen wir dessen Gültigkeit
    else if (inviteCode) {
      const referrer = await User.findOne({ username: inviteCode });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Ungültiger Einladungscode (Benutzername existiert nicht)'
        });
      }
      referredBy = referrer.username;
    } 
    // Wenn es nicht der erste Benutzer ist und kein Einladungscode angegeben wurde
    else {
      return res.status(400).json({
        success: false,
        message: 'Ein Einladungscode ist erforderlich'
      });
    }

    // Neuen Benutzer erstellen
    const user = await User.create({
      username,
      email,
      password,
      referredBy,
      // Erster Benutzer wird zum Admin
      role: isFirstUser ? 'admin' : 'user'
    });

    // Einladenden Benutzer aktualisieren (falls nicht erster Benutzer und Einladungscode vorhanden)
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

    // Token erstellen
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler bei der Registrierung'
    });
  }
};

// @desc    Benutzer einloggen
// @route   POST /api/auth/login
// @access  Public
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

    // Token erstellen
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Login'
    });
  }
};

// @desc    Aktuellen Benutzer abrufen
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('innerCircle', 'username');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error);
    res.status(500).json({
      success: false,
      message: 'Server-Fehler beim Abrufen des Benutzers'
    });
  }
}; 