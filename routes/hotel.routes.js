const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotel.controller');

// Step 1 — GET /api/hotels/locations?term=del&limit=10
router.get('/locations', hotelController.searchLocations);

// Step 2 — POST /api/hotels/search
router.post('/search', hotelController.searchHotels);

// Step 3 — POST /api/hotels/details
router.post('/details', hotelController.getHotelDetails);

// Step 4 — POST /api/hotels/room-availability
router.post('/room-availability', hotelController.getRoomAvailability);

// Step 5 — POST /api/hotels/check-rates
router.post('/check-rates', hotelController.checkRates);

// Step 6 — POST /api/hotels/book
router.post('/book', hotelController.bookHotel);

// Step 7 — POST /api/hotels/booking-detail
router.post('/booking-detail', hotelController.getBookingDetail);

// Step 8 — POST /api/hotels/cancel
router.post('/cancel', hotelController.cancelBooking);

// Utility — GET /api/hotels/my-bookings?userId=123
router.get('/my-bookings', hotelController.getMyHotelBookings);

module.exports = router;
