const { pool } = require('../config/db');

async function setupDatabase() {
    try {
        console.log('Setting up database tables...');

        // Bookings Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                booking_id VARCHAR(50) UNIQUE NOT NULL,
                pnr VARCHAR(20),
                trace_id VARCHAR(100),
                result_index VARCHAR(10),
                total_amount DECIMAL(12, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING',
                contact_email VARCHAR(100),
                contact_mobile VARCHAR(20),
                flight_data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Travellers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS booking_travellers (
                id SERIAL PRIMARY KEY,
                booking_id VARCHAR(50) REFERENCES bookings(booking_id),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                gender VARCHAR(10),
                dob DATE,
                passenger_type VARCHAR(10),
                passport_number VARCHAR(50),
                passport_expiry DATE
            );
        `);

        // Payments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS booking_payments (
                id SERIAL PRIMARY KEY,
                booking_id VARCHAR(50) REFERENCES bookings(booking_id),
                razorpay_order_id VARCHAR(100),
                razorpay_payment_id VARCHAR(100),
                razorpay_signature TEXT,
                amount DECIMAL(12, 2),
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

setupDatabase();
