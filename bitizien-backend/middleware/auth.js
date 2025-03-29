const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware zur Überprüfung des JWT-Tokens
exports.authenticateToken = async (req, res, next) => {
  let token;

  console.log('Authentifizierungsversuch mit Header:', req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'kein Auth-Header');

  // Token aus dem Authorization-Header extrahieren
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  }

  // Prüfen, ob ein Token vorhanden ist
  if (!token) {
    console.error('Authentifizierung fehlgeschlagen: Token fehlt');
    return res.status(401).json({
      success: false,
      message: 'Nicht autorisiert - Token fehlt'
    });
  }

  try {
    // Prüfen, ob es sich um das Dummy-Token handelt
    if (token === 'dummy_token_123' && process.env.USE_DUMMY_MODE === 'true') {
      console.log('Dummy-Token erkannt - Authentifizierung übersprungen');
      req.user = { 
        id: '123456789', 
        username: 'demo_user',
        email: 'demo@example.com',
        role: 'user'
      };
      return next();
    }
    
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verifiziert für Benutzer-ID:', decoded.id);

    // Benutzer aus der Datenbank abrufen
    const user = await User.findById(decoded.id);

    if (!user) {
      console.error('Authentifizierung fehlgeschlagen: Benutzer nicht gefunden mit ID:', decoded.id);
      
      // Versuche, alle Benutzer zu finden, um zu debuggen
      const allUsers = await User.find({}).select('_id username');
      console.log('Alle Benutzer in der Datenbank:', allUsers.map(u => ({id: u._id.toString(), username: u.username})));
      
      return res.status(401).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    req.user = user;
    console.log('Authentifizierung erfolgreich für:', req.user.username);
    next();
  } catch (error) {
    console.error('Authentifizierung fehlgeschlagen:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Nicht autorisiert - Ungültiges Token'
    });
  }
};

// Middleware zur Überprüfung von Admin-Rechten
exports.authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.error('Admin-Zugriff verweigert für:', req.user.username);
    return res.status(403).json({
      success: false,
      message: 'Nur Administratoren haben Zugriff auf diese Ressource'
    });
  }
  console.log('Admin-Zugriff gewährt für:', req.user.username);
  next();
}; 