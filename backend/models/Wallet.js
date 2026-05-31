const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['cash', 'bank', 'credit_card'], default: 'cash' },
  balance: { type: Number, default: 0 },
  color: { type: String, default: '#8b5cf6' }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
