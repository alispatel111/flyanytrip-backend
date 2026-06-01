const userStatsService = require('../services/userStats.service');

class UserStatsController {
  async getStats(req, res, next) {
    try {
      const userId = req.params.userId || req.user?.id;
      if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

      const data = await userStatsService.getUserStats(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async incrementBookingCount(req, res, next) {
    try {
      const data = await userStatsService.incrementBookingCount(req.params.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateLoyaltyPoints(req, res, next) {
    try {
      const { points } = req.body;
      const data = await userStatsService.updateLoyaltyPoints(req.params.userId, points);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserStatsController();
