require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const apiRoutes = require('./routes/apiRoutes');
const Camera = require('./models/Camera');
const Alert = require('./models/Alert');

const app = express();
const server = http.createServer(app);

// Allow requests from React frontend
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Compass'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// WebSocket Connection
io.on('connection', (socket) => {
  console.log(`🔌 Dashboard Client Connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Client Disconnected: ${socket.id}`));
});

// --- AI ALERT SIMULATOR (Runs on Server instead of Frontend) ---
setInterval(async () => {
  if (Math.random() > 0.6) { // 40% chance every 20 seconds
    try {
      // Pick a random online camera
      const cameras = await Camera.find({ status: 'online' });
      if (cameras.length === 0) return;
      const cam = cameras[Math.floor(Math.random() * cameras.length)];

      const types = ['Speeding Vehicle', 'Loitering', 'Jaywalking', 'Unattended Object'];
      const severities = ['low', 'medium', 'high'];

      const newAlert = new Alert({
        type: types[Math.floor(Math.random() * types.length)],
        location: cam.location,
        severity: severities[Math.floor(Math.random() * severities.length)],
        camera: cam.cameraId,
        resolved: false
      });

      await newAlert.save();
      
      // Push the new alert instantly to the React frontend
      io.emit('new_incident', newAlert);
      console.log(`[AI Trigger] New Alert: ${newAlert.type} at ${newAlert.location}`);
      
    } catch (error) {
      console.error("Simulation Error:", error);
    }
  }
}, 20000); // Runs every 20 seconds

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});