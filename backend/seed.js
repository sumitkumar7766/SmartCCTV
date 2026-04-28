// Yeh script aapke MongoDB mein sample data daalne ke liye hai
// Run command: node seed.js

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB URI (Apne environment ke hisaab se change kar sakte hain)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartcctv_brainbyte';

// --- Mongoose Models (Yahin define kiye hain taaki asani se run ho sake) ---
const cameraSchema = new mongoose.Schema({
  cameraId: String,
  location: String,
  status: String,
  type: String,
  aiActive: Boolean,
  mapX: Number,
  mapY: Number,
  image: String,
  detections: Array
});
const Camera = mongoose.models.Camera || mongoose.model('Camera', cameraSchema);

const alertSchema = new mongoose.Schema({
  type: String,
  location: String,
  severity: String,
  camera: String,
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);

const zoneSchema = new mongoose.Schema({
  name: String,
  health: Number,
  activeCameras: Number,
  incidents: Number
});
const Zone = mongoose.models.Zone || mongoose.model('Zone', zoneSchema);

// --- Sample Data ---
const camerasData = [
  { cameraId: 'CAM-01', location: 'Downtown Chauraha', status: 'online', type: 'PTZ', aiActive: true, mapX: 30, mapY: 40, image: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=800&q=80', detections: [{ type: 'vehicle', x: 20, y: 30, w: 15, h: 20 }] },
  { cameraId: 'CAM-02', location: 'Central Park North', status: 'online', type: 'Fixed', aiActive: true, mapX: 60, mapY: 25, image: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?auto=format&fit=crop&w=800&q=80', detections: [{ type: 'crowd', x: 40, y: 40, w: 30, h: 30 }] },
  { cameraId: 'CAM-03', location: 'Highway 42 Flyover', status: 'online', type: 'Thermal', aiActive: true, mapX: 75, mapY: 55, image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', detections: [{ type: 'vehicle', x: 10, y: 60, w: 20, h: 15 }] },
  { cameraId: 'CAM-04', location: 'City Hall Maidan', status: 'online', type: 'PTZ', aiActive: true, mapX: 45, mapY: 65, image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80', detections: [{ type: 'unattended_bag', x: 80, y: 80, w: 8, h: 8 }] },
  { cameraId: 'CAM-05', location: 'Metro Station Gate', status: 'offline', type: 'Fixed', aiActive: false, mapX: 20, mapY: 75, image: '', detections: [] }
];

const alertsData = [
  { type: 'Galat Parking', location: 'Downtown Chauraha', severity: 'medium', camera: 'CAM-01', resolved: false },
  { type: 'Bheed Jama Hai', location: 'Central Park North', severity: 'low', camera: 'CAM-02', resolved: false },
  { type: 'Aag/Dhua (Fire)', location: 'Industrial Area', severity: 'high', camera: 'CAM-06', resolved: true }
];

const zonesData = [
  { name: 'North District', health: 98, activeCameras: 142, incidents: 2 },
  { name: 'Downtown', health: 85, activeCameras: 310, incidents: 12 },
  { name: 'East Side', health: 100, activeCameras: 85, incidents: 0 },
  { name: 'Industrial Area', health: 92, activeCameras: 110, incidents: 4 }
];

// --- Main Seeder Function ---
async function seedDB() {
  try {
    console.log('⏳ MongoDB se connect ho raha hai...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Database connected!');

    console.log('🧹 Purana data delete kar rahe hain...');
    await Camera.deleteMany({});
    await Alert.deleteMany({});
    await Zone.deleteMany({});

    console.log('🌱 Naya sample data insert kar rahe hain...');
    await Camera.insertMany(camerasData);
    await Alert.insertMany(alertsData);
    await Zone.insertMany(zonesData);

    console.log('🎉 Data successfully save ho gaya hai!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error aaya hai:', error);
    process.exit(1);
  }
}

seedDB();