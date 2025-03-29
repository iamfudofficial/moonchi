const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Alte Indizes löschen (falls nötig)
mongoose.set('strictQuery', false);

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Bitte geben Sie einen Benutzernamen an'],
    unique: true,
    trim: true,
    minlength: [3, 'Benutzername muss mindestens 3 Zeichen lang sein'],
    maxlength: [20, 'Benutzername darf nicht länger als 20 Zeichen sein']
  },
  email: {
    type: String,
    required: [true, 'Bitte geben Sie eine E-Mail-Adresse an'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Bitte geben Sie eine gültige E-Mail-Adresse an'
    ]
  },
  password: {
    type: String,
    required: [true, 'Bitte geben Sie ein Passwort an'],
    minlength: [6, 'Passwort muss mindestens 6 Zeichen lang sein'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  miningRate: {
    type: Number,
    default: 1 // Basis-Mining-Rate
  },
  miningBoost: {
    type: Number,
    default: 1 // 1 = 100% (kein Boost)
  },
  lastMiningTime: {
    type: Date,
    default: null
  },
  innerCircle: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  referredBy: {
    type: String,
    default: null
  },
  invitees: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Passwort hashen vor dem Speichern
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// JWT Token-Methode
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Passwort-Vergleichsmethode
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Mining-Rate berechnen basierend auf Inner Circle und Boosts
UserSchema.methods.calculateMiningRate = async function() {
  // Basis-Rate
  let rate = 1;
  
  // Aktive Benutzer im Inner Circle zählen
  const activeUsers = this.innerCircle.length;
  
  // Boosts durch Inner Circle
  rate += (activeUsers * 0.2); // +20% pro aktivem Nutzer
  
  // Anwendung von Boosts (z.B. durch Events oder Achievements)
  rate *= this.miningBoost;
  
  this.miningRate = rate;
  await this.save();
  
  return rate;
};

module.exports = mongoose.model('User', UserSchema); 