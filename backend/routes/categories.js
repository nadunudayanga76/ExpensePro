const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

router.use(auth);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ 
      $or: [{ userId: req.userId }, { userId: { $exists: false } }] 
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a category
router.post('/', async (req, res) => {
  const category = new Category({
    userId: req.userId,
    name: req.body.name,
    color: req.body.color,
    icon: req.body.icon,
    group: req.body.group || 'General'
  });

  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.userId });
    if (!category) return res.status(404).json({ message: 'Category not found or unauthorized' });

    if (req.body.name) category.name = req.body.name;
    if (req.body.color) category.color = req.body.color;
    if (req.body.icon) category.icon = req.body.icon;
    if (req.body.group) category.group = req.body.group;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    // Check if category is used by expenses
    const expensesCount = await Expense.countDocuments({ categoryId: req.params.id });
    if (expensesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category because it is currently used by existing expenses.' });
    }

    // Check if category is used by budgets
    const budgetsCount = await Budget.countDocuments({ categoryId: req.params.id, userId: req.userId });
    if (budgetsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category because a budget is assigned to it.' });
    }

    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!category) return res.status(404).json({ message: 'Category not found or unauthorized' });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
