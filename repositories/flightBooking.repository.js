const prisma = require('../config/prisma');

class FlightBookingRepository {
  async findByBookingId(bookingId) {
    return prisma.flight_bookings.findUnique({
      where: { booking_id: bookingId }
    });
  }

  async create(data) {
    return prisma.flight_bookings.create({ data });
  }

  async update(id, data) {
    return prisma.flight_bookings.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async cancel(id) {
    return prisma.flight_bookings.update({
      where: { id: parseInt(id) },
      data: { booking_status: 'CANCELLED', ticket_status: 'CANCELLED' }
    });
  }
}

module.exports = new FlightBookingRepository();
