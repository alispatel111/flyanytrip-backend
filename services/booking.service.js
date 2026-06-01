const bookingRepository = require('../repositories/booking.repository');

class BookingService {
  async getAllBookings() {
    return bookingRepository.findAll();
  }

  async getBookingById(id) {
    return bookingRepository.findById(id);
  }

  async getBookingsByUser(userId) {
    return bookingRepository.findByUserId(userId);
  }

  async createBooking(data) {
    return bookingRepository.create(data);
  }

  async updateBookingStatus(id, status) {
    return bookingRepository.updateStatus(id, status);
  }
}

module.exports = new BookingService();
