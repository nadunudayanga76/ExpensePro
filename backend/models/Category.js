const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for default categories
  name: { type: String, required: true, unique: true },
  color: { type: String, required: true }, // Hex code for vibrant accents
  icon: { type: String, required: true }, // Name of the lucide-react icon
  group: { type: String, default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
