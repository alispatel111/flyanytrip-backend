const travellerService = require('../services/traveller.service');

class TravellerController {
  async getAll(req, res, next) {
    try {
      // Assuming userId is passed as query param or extracted from token
      const userId = req.query.userId || req.user?.id;
      if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
      
      const data = await travellerService.getTravellersByUser(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await travellerService.addTraveller(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await travellerService.updateTraveller(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const data = await travellerService.deleteTraveller(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TravellerController();
