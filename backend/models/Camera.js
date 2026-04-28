const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  cameraId: { type: String, required: true, unique: true }, // e.g., 'CAM-01'
  location: String,
  status: { type: String, enum: ['online', 'offline'], default: 'online' },
  type: String,
  aiActive: Boolean,
  mapX: Number,
  mapY: Number,
  image: String,
  detections: Array // Stores bounding box data
});

module.exports = mongoose.model('Camera', cameraSchema);