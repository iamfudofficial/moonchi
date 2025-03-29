const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Aktive Benutzer speichern
const activeUsers = new Map();

module.exports = (io) => {
  // Middleware zur Authentifizierung von Socket-Verbindungen
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentifizierung erforderlich'));
      }
      
      // Token verifizieren
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Benutzer abrufen
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Benutzer nicht gefunden'));
      }
      
      // Benutzer an Socket anhängen
      socket.user = {
        id: user._id,
        username: user.username,
        role: user.role
      };
      
      next();
    } catch (error) {
      return next(new Error('Ungültiges Token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Benutzer verbunden: ${socket.user.username}`);
    
    // Benutzer zu aktiven Benutzern hinzufügen
    activeUsers.set(socket.user.id.toString(), {
      socketId: socket.id,
      username: socket.user.username,
      role: socket.user.role
    });
    
    // Liste der aktiven Benutzer an alle senden
    io.emit('userList', Array.from(activeUsers.values()));
    
    // Nachricht an den globalen Chat senden
    socket.on('globalMessage', async (content) => {
      try {
        if (!content.trim()) {
          return socket.emit('error', 'Nachricht darf nicht leer sein');
        }
        
        // Neue Nachricht in der Datenbank speichern
        const message = await Message.create({
          sender: socket.user.id,
          content,
          isGlobal: true
        });
        
        // Nachricht an alle Clients senden
        io.emit('globalMessage', {
          id: message._id,
          sender: socket.user.username,
          content: message.content,
          createdAt: message.createdAt,
          senderId: socket.user.id,
          senderRole: socket.user.role
        });
      } catch (error) {
        socket.emit('error', 'Fehler beim Senden der Nachricht');
      }
    });
    
    // Private Nachricht senden
    socket.on('privateMessage', async ({ receiverId, content }) => {
      try {
        const receiver = await User.findById(receiverId);
        
        if (!receiver) {
          return socket.emit('error', 'Empfänger nicht gefunden');
        }
        
        if (!content.trim()) {
          return socket.emit('error', 'Nachricht darf nicht leer sein');
        }
        
        // Nachricht in der Datenbank speichern
        const message = await Message.create({
          sender: socket.user.id,
          receiver: receiverId,
          content,
          isGlobal: false
        });
        
        const messageData = {
          id: message._id,
          sender: socket.user.username,
          content: message.content,
          createdAt: message.createdAt,
          senderId: socket.user.id
        };
        
        // Nachricht an den Empfänger senden, wenn er online ist
        const receiverSocket = activeUsers.get(receiverId)?.socketId;
        if (receiverSocket) {
          io.to(receiverSocket).emit('privateMessage', messageData);
        }
        
        // Nachricht auch an den Sender senden (für die UI)
        socket.emit('privateMessage', messageData);
      } catch (error) {
        socket.emit('error', 'Fehler beim Senden der privaten Nachricht');
      }
    });
    
    // Beim Trennen der Verbindung
    socket.on('disconnect', () => {
      console.log(`Benutzer getrennt: ${socket.user.username}`);
      
      // Benutzer aus der Liste der aktiven Benutzer entfernen
      activeUsers.delete(socket.user.id.toString());
      
      // Aktualisierte Liste der aktiven Benutzer an alle senden
      io.emit('userList', Array.from(activeUsers.values()));
    });
  });
  
  // Hilfsfunktion zum Abrufen von Chat-Nachrichten
  async function getGlobalMessages(limit = 50) {
    try {
      return await Message.find({ isGlobal: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'username role')
        .lean();
    } catch (error) {
      console.error('Fehler beim Abrufen globaler Nachrichten:', error);
      return [];
    }
  }
  
  // Hilfsfunktion zum Abrufen privater Nachrichten
  async function getPrivateMessages(userId, otherUserId, limit = 50) {
    try {
      return await Message.find({
        isGlobal: false,
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender', 'username')
        .populate('receiver', 'username')
        .lean();
    } catch (error) {
      console.error('Fehler beim Abrufen privater Nachrichten:', error);
      return [];
    }
  }
  
  return {
    activeUsers,
    getGlobalMessages,
    getPrivateMessages
  };
}; 