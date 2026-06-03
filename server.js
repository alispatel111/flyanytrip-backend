require('dotenv').config();

// Fix for Prisma BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const flightRoutes = require('./routes/flight.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const couponRoutes = require('./routes/coupon.routes');

// Prisma ORM Routes
const usersRoutes = require('./routes/users.routes');
const travellersRoutes = require('./routes/travellers.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const flightBookingsRoutes = require('./routes/flightBookings.routes');
const userStatsRoutes = require('./routes/userStats.routes');

const app = express();

// Root route (Top level for Vercel preview)
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flyantrip Backend is active and running!' });
});

// Middlewares for Security and Performance
app.use(helmet()); // Secure HTTP headers

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://flyanytrip-frontend.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Standard CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' })); // Body parser with payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('short')); // Simplified request logging to reduce terminal clutter

app.use('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flyantrip Backend is running!' });
});

app.use('/api/flights', flightRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/coupons', couponRoutes);

// Prisma ORM Endpoints
app.use('/api/v2/users', usersRoutes);
app.use('/api/v2/travellers', travellersRoutes);
app.use('/api/v2/bookings', bookingsRoutes);
app.use('/api/v2/flight-bookings', flightBookingsRoutes);
app.use('/api/v2/user-stats', userStatsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server (Only for local development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Check Database Connection
    try {
      const prisma = require('./config/prisma');
      await prisma.$connect();
      console.log('✅ Database is connected successfully.');
    } catch (error) {
      console.error('❌ Database is NOT connected:', error.message);
    }
  });
}

// Export app for Vercel
module.exports = app;
