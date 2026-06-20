const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Connect to MongoDB on each request (cached — only actually connects once)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(503).json({ success: false, message: 'Database connection failed. Please try again.' });
  }
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/students', require('./routes/students'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SSUET Event Portal API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Server configuration — only listen locally, Vercel uses module.exports
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 SSUET Event Portal Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
