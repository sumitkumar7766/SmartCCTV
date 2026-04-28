const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  cityName: { type: String, default: 'Metropolis Dept of Transportation' },
  timezone: { type: String, default: 'UTC' },
  darkModeAuto: { type: Boolean, default: true },
  displayBoundingBoxes: { type: Boolean, default: true },
  autoArchive: { type: Boolean, default: false }
});

module.exports = mongoose.model('Setting', settingSchema);