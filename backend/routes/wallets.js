const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const auth = require('../middleware/auth');

router.use(auth);

// Get all wallets
router.get('/', async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.userId });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a wallet
router.post('/', async (req, res) => {
  const wallet = new Wallet({
    userId: req.userId,
    name: req.body.name,
    type: req.body.type || 'cash',
    balance: req.body.balance || 0,
    color: req.body.color || '#8b5cf6'
  });

  try {
    const newWallet = await wallet.save();
    res.status(201).json(newWallet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a wallet
router.delete('/:id', async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json({ message: 'Wallet deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
