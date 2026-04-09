const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const gate = require('./routes/gate');
const { startLateReturnCron } = require('./services/cronService');

const app = express();

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(globalLimiter);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel_management';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    startLateReturnCron();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/auth/login', loginLimiter);
app.use('/api/students', require('./routes/students'));
app.use('/api/nightout', require('./routes/nightout'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/notices',  require('./routes/notices'));
app.use('/api/fees',     require('./routes/fees'));
app.use('/api/mess',     require('./routes/mess'));   // ✅ NEW
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/gate',     gate);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile access: http://192.168.1.46:${PORT}`);
});
