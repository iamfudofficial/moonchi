const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null bedeutet Global-Chat
  },
  content: {
    type: String,
    required: [true, 'Eine Nachricht darf nicht leer sein'],
    trim: true,
    maxlength: [500, 'Eine Nachricht darf nicht länger als 500 Zeichen sein']
  },
  isGlobal: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index für die Abfrage von Nachrichten
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ isGlobal: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema); 