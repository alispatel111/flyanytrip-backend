const prisma = require('../config/prisma');

class BookingRepository {
  async findAll() {
    return prisma.bookings.findMany();
  }

  async findById(id) {
    return prisma.bookings.findUnique({
      where: { id: parseInt(id) },
      include: { flight_bookings: true }
    });
  }

  async findByUserId(userId) {
    return prisma.bookings.findMany({
      where: { user_id: parseInt(userId) },
      include: { flight_bookings: true }
    });
  }

  async create(data) {
    return prisma.bookings.create({ data });
  }

  async updateStatus(id, status) {
    return prisma.bookings.update({
      where: { id: parseInt(id) },
      data: { status }
    });
  }
}

module.exports = new BookingRepository();
