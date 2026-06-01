const flightBookingRepository = require('../repositories/flightBooking.repository');

class FlightBookingService {
  async getFlightBookingDetails(bookingId) {
    return flightBookingRepository.findByBookingId(bookingId);
  }

  async createFlightBooking(data) {
    return flightBookingRepository.create(data);
  }

  async updateFlightBooking(id, data) {
    return flightBookingRepository.update(id, data);
  }

  async cancelBooking(id) {
    return flightBookingRepository.cancel(id);
  }
}

module.exports = new FlightBookingService();
