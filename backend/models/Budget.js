const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, unique: true },
  amountLimit: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
