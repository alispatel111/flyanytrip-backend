const prisma = require('../config/prisma');

class UserStatsRepository {
  async findByUserId(userId) {
    return prisma.user_stats.findUnique({
      where: { user_id: parseInt(userId) }
    });
  }

  async incrementBookingCount(userId) {
    return prisma.user_stats.update({
      where: { user_id: parseInt(userId) },
      data: { total_bookings: { increment: 1 } }
    });
  }

  async updateLoyaltyPoints(userId, points) {
    return prisma.user_stats.update({
      where: { user_id: parseInt(userId) },
      data: { loyalty_points: { increment: points } }
    });
  }
}

module.exports = new UserStatsRepository();
