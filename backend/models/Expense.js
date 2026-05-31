const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  amount: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
  incomeSource: { type: String, enum: ['salary', 'freelance', 'investment', 'gift', 'refund', 'business', 'rental', 'other'], default: 'other' },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
