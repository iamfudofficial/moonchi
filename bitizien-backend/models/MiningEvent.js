const mongoose = require('mongoose');

const MiningEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  miningRate: {
    type: Number,
    required: true
  },
  innerCircleBonus: {
    type: Number,
    default: 0
  },
  otherBonus: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MiningEvent', MiningEventSchema); 