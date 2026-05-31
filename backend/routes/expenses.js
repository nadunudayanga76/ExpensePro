const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.use(auth); // Protect all expense routes

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId })
      .populate('categoryId')
      .populate('walletId')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create an expense (Transaction)
router.post('/', async (req, res) => {
  const expense = new Expense({
    userId: req.userId,
    walletId: req.body.walletId,
    type: req.body.type || 'expense',
    amount: req.body.amount,
    categoryId: req.body.categoryId || null,
    date: req.body.date,
    notes: req.body.notes
  });

  try {
    const newExpense = await expense.save();
    
    // Update Wallet Balance
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findOne({ _id: req.body.walletId, userId: req.userId });
    if (wallet) {
      if (req.body.type === 'income') {
        wallet.balance += Number(req.body.amount);
      } else {
        wallet.balance -= Number(req.body.amount);
      }
      await wallet.save();
    }

    const populatedExpense = await Expense.findById(newExpense._id).populate(['categoryId', 'walletId']);
    res.status(201).json(populatedExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    // Reverse Wallet Balance
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findOne({ _id: expense.walletId, userId: req.userId });
    if (wallet) {
      if (expense.type === 'income') {
        wallet.balance -= Number(expense.amount);
      } else {
        wallet.balance += Number(expense.amount);
      }
      await wallet.save();
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Scan a receipt
router.post('/scan', upload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analyze this receipt. Extract the total amount, a guess for the category name (e.g., 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Health & Fitness'), and notes (e.g., the store name or items). Return ONLY a JSON object with keys: "amount" (number), "categoryName" (string), "notes" (string). Do not return markdown.`;
    
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    let text = result.response.text();
    
    // Clean up potential markdown formatting
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ message: 'Failed to scan receipt' });
  }
});

module.exports = router;
