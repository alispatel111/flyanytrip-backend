const userStatsRepository = require('../repositories/userStats.repository');

class UserStatsService {
  async getUserStats(userId) {
    return userStatsRepository.findByUserId(userId);
  }

  async incrementBookingCount(userId) {
    return userStatsRepository.incrementBookingCount(userId);
  }

  async updateLoyaltyPoints(userId, points) {
    return userStatsRepository.updateLoyaltyPoints(userId, points);
  }
}

module.exports = new UserStatsService();
