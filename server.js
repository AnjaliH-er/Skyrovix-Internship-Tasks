const express = require('express');
const path = require('node:path');
const cors = require('cors');
const morgan = require('morgan');

const { seedDatabase } = require('./src/utils/seeder');
const bookRoutes = require('./src/routes/bookRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const loanRoutes = require('./src/routes/loanRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static Frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Seed Database with initial catalog if empty
seedDatabase();

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Fallback to SPA index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
=============================================================
   📚 Skyrovix Library Management System (Full Stack)
=============================================================
   🚀 Server is running on: http://localhost:${PORT}
   💾 Native SQLite DB:      data/library.db
   ⚡ Real-time API & SPA UI Active!
=============================================================
  `);
});
