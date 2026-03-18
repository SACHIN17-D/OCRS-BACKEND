require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');

// Setup passport strategies
require('./config/passport');
const passport = require('passport');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'https://ocrs-frontend.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    // Allow all vercel preview URLs
    if (!origin || allowed.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (required for passport)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/reports',  require('./routes/report.routes'));
app.use('/api/evidence', require('./routes/evidence.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));
app.use('/api/hod',       require('./routes/hod.routes'));
app.use('/api/principal', require('./routes/principal.routes'));

// Health check
app.get('/', (req, res) => res.json({ message: '✅ OCRS API is running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});