const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

router.use(auth);

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId }).populate('categoryId');
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update a budget
router.post('/', async (req, res) => {
  try {
    const existingBudget = await Budget.findOne({ categoryId: req.body.categoryId, userId: req.userId });
    if (existingBudget) {
      existingBudget.amountLimit = req.body.amountLimit;
      const updatedBudget = await existingBudget.save();
      const populatedBudget = await updatedBudget.populate('categoryId');
      return res.json(populatedBudget);
    }
    
    const budget = new Budget({
      userId: req.userId,
      categoryId: req.body.categoryId,
      amountLimit: req.body.amountLimit
    });
    
    const newBudget = await budget.save();
    const populatedBudget = await newBudget.populate('categoryId');
    res.status(201).json(populatedBudget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
