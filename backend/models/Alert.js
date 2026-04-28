const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: String, // e.g., 'Speeding Vehicle'
  location: String,
  severity: { type: String, enum: ['low', 'medium', 'high'] },
  camera: String,
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);