const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const morgan = require('morgan'); // Logger für HTTP-Anfragen (muss installiert werden: npm install morgan)
const helmet = require('helmet'); // Sicherheits-Middleware (muss installiert werden: npm install helmet)

// Umgebungsvariablen laden
dotenv.config();

// Prüfe, ob wir im Dummy-Modus laufen sollen
const USE_DUMMY_MODE = process.env.USE_DUMMY_MODE === 'true' || false;

// Route-Importe
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const miningRoutes = require('./routes/mining');

// Middleware-Importe
const { authenticateToken } = require('./middleware/auth');

// Express-App initialisieren
const app = express();
const server = http.createServer(app);

// Socket.io für Echtzeit-Kommunikation einrichten
const io = socketIo(server, {
  cors: {
    origin: '*', // In Produktion einschränken
    methods: ['GET', 'POST']
  }
});

// === Middleware ===

// CORS für Cross-Origin Anfragen
app.use(cors());

// JSON-Parser für Request Body
app.use(express.json());

// Request-Logging im Entwicklungsmodus (installiere morgan mit: npm install morgan)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
  console.log('Server läuft im Entwicklungsmodus');
} else {
  console.log('Server läuft im Produktionsmodus');
}

// Sicherheits-Header (installiere helmet mit: npm install helmet)
try {
  app.use(helmet());
} catch (error) {
  console.warn('Helmet ist nicht installiert. Führe "npm install helmet" aus, um die Sicherheit zu verbessern.');
}

// === Datenbankkonfiguration ===

// MongoDB-Verbindung herstellen
const connectDB = async () => {
  if (USE_DUMMY_MODE) {
    console.log('Server läuft im Dummy-Modus ohne Datenbank!');
    return;
  }
  
  try {
    console.log('Versuche, Verbindung zur MongoDB herzustellen mit URI:', 
                process.env.MONGO_URI ? 
                `${process.env.MONGO_URI.substring(0, 30)}...` : 
                'mongodb://localhost:27017/bitizien');
    
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bitizien', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // entfernt in neueren mongoose-Versionen
      // useFindAndModify: false, // entfernt in neueren mongoose-Versionen
    });
    
    console.log(`MongoDB verbunden: ${conn.connection.host}`);
    
    // Prüfen, ob Benutzer existieren
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log(`Anzahl der Benutzer in der Datenbank: ${userCount}`);
    
    // Alle Benutzer auflisten
    if (userCount > 0) {
      const users = await User.find({}).select('_id username email');
      console.log('Benutzer in der Datenbank:');
      users.forEach(user => {
        console.log(`- ID: ${user._id}, Benutzername: ${user.username}, E-Mail: ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error(`MongoDB Verbindungsfehler: ${error.message}`);
    console.log('Server wechselt in den Dummy-Modus ohne Datenbank!');
    process.env.USE_DUMMY_MODE = 'true';
  }
};

// Datenbankverbindung herstellen
connectDB();

// Socket.io-Setup für Chat
if (USE_DUMMY_MODE) {
  // Aktive Benutzer für Dummy-Modus
  const dummyActiveUsers = new Map();
  
  // Dummy-Socket-Verbindung ohne Authentifizierung
  io.on('connection', (socket) => {
    console.log('Neue Socket-Verbindung im Dummy-Modus');
    
    // Den verbundenen Benutzer als Demo-Benutzer identifizieren
    socket.user = {
      id: '123456789',
      username: 'demo_user',
      role: 'user'
    };
    
    // Benutzer zu aktiven Benutzern hinzufügen
    dummyActiveUsers.set(socket.user.id, {
      socketId: socket.id,
      username: socket.user.username,
      role: socket.user.role
    });
    
    // Einige Demo-Benutzer hinzufügen
    dummyActiveUsers.set('admin1', {
      socketId: 'admin-socket-1',
      username: 'admin',
      role: 'admin'
    });
    
    dummyActiveUsers.set('user1', {
      socketId: 'user-socket-1',
      username: 'bitizien_fan',
      role: 'user'
    });
    
    dummyActiveUsers.set('user2', {
      socketId: 'user-socket-2',
      username: 'crypto_miner',
      role: 'user'
    });
    
    // Liste der aktiven Benutzer an den Client senden
    socket.emit('userList', Array.from(dummyActiveUsers.values()));
    
    // Demo-Nachrichten senden
    setTimeout(() => {
      socket.emit('globalMessage', {
        id: 'msg1',
        sender: 'admin',
        content: 'Willkommen in der Bitizien-Community! Hier kannst du mit anderen Minern chatten.',
        createdAt: new Date().toISOString(),
        senderId: 'admin1',
        senderRole: 'admin'
      });
    }, 1000);
    
    setTimeout(() => {
      socket.emit('globalMessage', {
        id: 'msg2',
        sender: 'bitizien_fan',
        content: 'Hey, hat jemand schon die neuen Mining-Boosts ausprobiert?',
        createdAt: new Date().toISOString(),
        senderId: 'user1',
        senderRole: 'user'
      });
    }, 2000);
    
    setTimeout(() => {
      socket.emit('globalMessage', {
        id: 'msg3',
        sender: 'crypto_miner',
        content: 'Ja, die sind super! Ich habe meinen Inner Circle schon auf 3 Leute erweitert.',
        createdAt: new Date().toISOString(),
        senderId: 'user2',
        senderRole: 'user'
      });
    }, 3000);
    
    // Wenn der Client eine Nachricht sendet
    socket.on('globalMessage', (content) => {
      console.log('Dummy-Modus: Nachricht erhalten:', content);
      
      // Nachricht zurück an den Client senden
      const newMessageId = 'msg-' + Date.now();
      socket.emit('globalMessage', {
        id: newMessageId,
        sender: socket.user.username,
        content: content,
        createdAt: new Date().toISOString(),
        senderId: socket.user.id,
        senderRole: socket.user.role
      });
      
      // Zufällige Antwort nach kurzer Verzögerung
      setTimeout(() => {
        const responses = [
          { sender: 'admin', role: 'admin', id: 'admin1', text: 'Danke für deine Nachricht! Hast du schon versucht, neue Freunde einzuladen?' },
          { sender: 'bitizien_fan', role: 'user', id: 'user1', text: 'Cool! Wie viele Coins hast du schon gesammelt?' },
          { sender: 'crypto_miner', role: 'user', id: 'user2', text: 'Nice! Ich bin auch schon seit einer Weile dabei.' }
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        socket.emit('globalMessage', {
          id: 'resp-' + Date.now(),
          sender: randomResponse.sender,
          content: randomResponse.text,
          createdAt: new Date().toISOString(),
          senderId: randomResponse.id,
          senderRole: randomResponse.role
        });
      }, 1500);
    });
    
    // Verbindung trennen
    socket.on('disconnect', () => {
      console.log('Socket-Verbindung getrennt im Dummy-Modus');
      dummyActiveUsers.delete(socket.user.id);
    });
  });
} else {
  // Standard Socket.io-Setup mit echter Datenbank
  require('./utils/socket')(io);
}

// === API-Routen ===

// Wenn wir im Dummy-Modus sind, verwenden wir Mock-Antworten
if (USE_DUMMY_MODE) {
  app.use('/api/auth', (req, res) => {
    if (req.path === '/register') {
      return res.json({ 
        success: true, 
        data: { 
          user: { 
            username: 'demo_user',
            email: 'demo@example.com',
            _id: '123456789'
          }, 
          token: 'dummy_token_123' 
        } 
      });
    } else if (req.path === '/login') {
      return res.json({ 
        success: true, 
        data: { 
          user: { 
            username: 'demo_user',
            email: 'demo@example.com',
            _id: '123456789'
          }, 
          token: 'dummy_token_123' 
        } 
      });
    }
    return res.status(404).json({ success: false, message: 'Route nicht gefunden' });
  });
  
  app.use('/api/users', (req, res) => {
    return res.json({ 
      success: true, 
      data: { 
        username: 'demo_user',
        email: 'demo@example.com',
        _id: '123456789',
        miningRate: 10,
        wallet: { balance: 500 },
        totalMined: 1500,
        referrals: []
      } 
    });
  });
  
  app.use('/api/mining', (req, res) => {
    if (req.path === '/start' || req.path === '/mine') {
      return res.json({ 
        success: true, 
        message: 'Mining gestartet',
        data: {
          reward: 10,
          newBalance: 510
        }
      });
    } else if (req.path === '/stats') {
      return res.json({ 
        success: true, 
        data: { 
          walletBalance: 500,
          miningRate: 10, 
          innerCircleCount: 2,
          innerCircleBonus: 0.4, 
          miningBoost: 1.4,
          totalRate: 10,
          lastMiningReward: 10,
          lastMiningTime: new Date().toISOString(),
          canMineNow: true,
          timeUntilNextMining: 0
        } 
      });
    } else if (req.path === '/history') {
      // Erstelle Mock-Mining-Verlauf mit Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      
      // Erstelle Beispieldaten für den Mining-Verlauf
      const mockData = [];
      const totalItems = 25; // Gesamt-Anzahl der Mock-Einträge
      
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, totalItems);
      
      for (let i = startIndex; i < endIndex; i++) {
        const daysAgo = Math.floor(i / 3); // Gruppiere je 3 Einträge pro Tag
        const hoursAgo = (i % 3) * 8; // 8 Stunden Abstand zwischen Einträgen
        
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(date.getHours() - hoursAgo);
        
        mockData.push({
          _id: `mining_${i}`,
          amount: 10 + (i % 5), // Variiere die Beträge etwas
          timestamp: date.toISOString(),
          miningRate: 1 + (i % 10) / 10, // Variiere die Mining-Rate
          innerCircleBonus: i % 3 === 0 ? 2 : 0, // Manchmal Bonus hinzufügen
          otherBonus: i % 5 === 0 ? 1 : 0, // Manchmal anderen Bonus hinzufügen
          user: '123456789'
        });
      }
      
      return res.json({ 
        success: true, 
        count: mockData.length,
        total: totalItems,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit)
        },
        data: mockData
      });
    } else if (req.path === '/inner-circle') {
      return res.json({ 
        success: true, 
        count: 2,
        maxCount: 5,
        data: [
          { _id: 'user1', username: 'freund1', email: 'freund1@example.com' },
          { _id: 'user2', username: 'freund2', email: 'freund2@example.com' }
        ] 
      });
    }
    return res.status(404).json({ success: false, message: 'Route nicht gefunden' });
  });
} else {
  // Standard-Routen mit DB-Verbindung
  // Öffentliche Routen
  app.use('/api/auth', authRoutes);
  
  // Geschützte Routen (mit JWT-Auth)
  app.use('/api/users', authenticateToken, userRoutes);
  app.use('/api/mining', authenticateToken, miningRoutes);
}

// Basis-Route für API-Prüfung
app.get('/', (req, res) => {
  res.json({ 
    message: 'Willkommen bei der Bitizien API',
    version: '1.0.0',
    status: 'online',
    dummyMode: USE_DUMMY_MODE
  });
});

// Fehlerbehandlung für nicht gefundene Routen
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route nicht gefunden' 
  });
});

// Globale Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('Serverfehler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Interner Serverfehler' 
      : err.message
  });
});

// === Server starten ===

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`API erreichbar unter: http://localhost:${PORT}`);
});

// Mining-Timer starten (nur wenn nicht im Dummy-Modus)
if (!USE_DUMMY_MODE) {
  const { startMiningTimer } = require('./utils/miningEngine');
  startMiningTimer();
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM erhalten. Server wird beendet...');
  server.close(() => {
    console.log('HTTP-Server geschlossen.');
    if (!USE_DUMMY_MODE) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB-Verbindung geschlossen.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}); 