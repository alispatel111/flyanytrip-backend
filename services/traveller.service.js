const travellerRepository = require('../repositories/traveller.repository');

class TravellerService {
  async getTravellersByUser(userId) {
    return travellerRepository.findByUserId(userId);
  }

  async addTraveller(data) {
    return travellerRepository.create(data);
  }

  async updateTraveller(id, data) {
    return travellerRepository.update(id, data);
  }

  async deleteTraveller(id) {
    return travellerRepository.delete(id);
  }
}

module.exports = new TravellerService();
