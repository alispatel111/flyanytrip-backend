const { pool } = require('../config/db');

async function checkBookings() {
  try {
    const result = await pool.query('SELECT * FROM bookings LIMIT 10;');
    console.log('Bookings in database:', JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    process.exit(1);
  }
}

checkBookings();
