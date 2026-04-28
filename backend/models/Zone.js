const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: String,
  health: Number,
  activeCameras: Number,
  incidents: Number
});

module.exports = mongoose.model('Zone', zoneSchema);