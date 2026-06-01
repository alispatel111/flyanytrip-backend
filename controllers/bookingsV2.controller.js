const bookingService = require('../services/booking.service');

class BookingController {
  async getAll(req, res, next) {
    try {
      const data = await bookingService.getAllBookings();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await bookingService.getBookingById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getByUser(req, res, next) {
    try {
      const userId = req.query.userId || req.user?.id;
      if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
      
      const data = await bookingService.getBookingsByUser(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await bookingService.createBooking(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const data = await bookingService.updateBookingStatus(req.params.id, status);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();
