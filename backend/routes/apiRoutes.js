const express = require('express');
const router = express.Router();
const Camera = require('../models/Camera');
const Alert = require('../models/Alert');
const Zone = require('../models/Zone');
const Setting = require('../models/Setting');

// ==========================================
// 📷 CAMERAS ROUTES
// ==========================================

// GET: Saare cameras fetch karne ke liye
router.get('/cameras', async (req, res) => {
  try {
    const cameras = await Camera.find();
    res.json(cameras);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (POST): Naya camera add karne ke liye
router.post('/cameras', async (req, res) => {
  try {
    const newCamera = new Camera(req.body);
    const savedCamera = await newCamera.save();
    res.status(201).json(savedCamera);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// EDIT (PUT): Kisi existing camera ki details update karne ke liye
router.put('/cameras/:id', async (req, res) => {
  try {
    const updatedCamera = await Camera.findByIdAndUpdate(
      req.params.id, // MongoDB ka _id
      req.body,      // Jo naya data frontend se aayega
      { new: true }  // Update hone ke baad naya document return karega
    );
    if (!updatedCamera) return res.status(404).json({ message: "Camera not found" });
    res.json(updatedCamera);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Camera delete karne ke liye (Bonus feature)
router.delete('/cameras/:id', async (req, res) => {
  try {
    const deletedCamera = await Camera.findByIdAndDelete(req.params.id);
    if (!deletedCamera) return res.status(404).json({ message: "Camera not found" });
    res.json({ message: "Camera deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 📍 ZONES ROUTES
// ==========================================

// GET: Saare zones fetch karne ke liye
router.get('/zones', async (req, res) => {
  try {
    const zones = await Zone.find();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (POST): Naya zone add karne ke liye
router.post('/zones', async (req, res) => {
  try {
    const newZone = new Zone(req.body);
    const savedZone = await newZone.save();
    res.status(201).json(savedZone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// EDIT (PUT): Zone update karne ke liye (e.g., health status change karna)
router.put('/zones/:id', async (req, res) => {
  try {
    const updatedZone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedZone) return res.status(404).json({ message: "Zone not found" });
    res.json(updatedZone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ==========================================
// 🚨 ALERTS ROUTES
// ==========================================

// GET: Saare alerts fetch karne ke liye (Latest 50)
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDIT (PATCH): Alert ko resolved mark karne ke liye (Pehle se tha)
router.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { resolved: true }, { new: true });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// ⚙️ SETTINGS ROUTES
// ==========================================

router.get('/settings', async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;