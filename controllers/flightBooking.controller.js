const flightBookingService = require('../services/flightBooking.service');

class FlightBookingController {
  async getByBookingId(req, res, next) {
    try {
      const data = await flightBookingService.getFlightBookingDetails(req.params.bookingId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await flightBookingService.createFlightBooking(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await flightBookingService.updateFlightBooking(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const data = await flightBookingService.cancelBooking(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlightBookingController();
