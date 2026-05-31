const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Hashed password for email auth
  name: { type: String, required: true },
  picture: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
