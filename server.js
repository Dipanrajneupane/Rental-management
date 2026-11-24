const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Setup photo upload storage
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'vehicle_' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Real-time broadcast helper
async function broadcastUpdate(action, data = null) {
  try {
    const state = await db.getState();
    io.emit('state_update', { action, data, state, timestamp: Date.now() });
  } catch (err) {
    console.error('Broadcast error:', err);
  }
}

// Socket.io connection handling
io.on('connection', async (socket) => {
  // Send state immediately upon connection
  try {
    const state = await db.getState();
    socket.emit('state_update', { action: 'initial', state, timestamp: Date.now() });
  } catch (e) {}

  socket.on('disconnect', () => {});
});

// API Routes
app.get('/api/state', async (req, res) => {
  try {
    const state = await db.getState();
    const dbStatus = db.getDbStatus();
    res.json({ success: true, ...state, dbStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Photo upload endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const photoUrl = '/uploads/' + req.file.filename;
  res.json({ success: true, photoUrl });
});

// Add Vehicle
app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicle = await db.addVehicle(req.body);
    await broadcastUpdate('vehicle_added', vehicle);
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Vehicle
app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await db.updateVehicle(req.params.id, req.body);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await broadcastUpdate('vehicle_updated', vehicle);
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Vehicle
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const ok = await db.deleteVehicle(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await broadcastUpdate('vehicle_deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rent or Book Vehicle
app.post('/api/rent', async (req, res) => {
  try {
    const { vehicle_id, ...rentalData } = req.body;
    if (!vehicle_id) return res.status(400).json({ success: false, message: 'vehicle_id required' });
    const vehicle = await db.rentOrBookVehicle(vehicle_id, rentalData);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await broadcastUpdate('rental_created', vehicle);
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Return Vehicle
app.post('/api/return', async (req, res) => {
  try {
    const { vehicle_id, ...returnData } = req.body;
    if (!vehicle_id) return res.status(400).json({ success: false, message: 'vehicle_id required' });
    const result = await db.returnVehicle(vehicle_id, returnData);
    if (!result) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await broadcastUpdate('vehicle_returned', result);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete History Record
app.delete('/api/history/:id', async (req, res) => {
  try {
    const ok = await db.deleteHistory(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'History record not found' });
    await broadcastUpdate('history_deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Status check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    server_time: new Date().toISOString(),
    db: db.getDbStatus()
  });
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Bharatpur Bike & Car Rental Server running at http://localhost:${PORT}`);
});
