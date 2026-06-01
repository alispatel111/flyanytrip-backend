const prisma = require('../config/prisma');

class TravellerRepository {
  async findByUserId(userId) {
    return prisma.co_travellers.findMany({
      where: { user_id: parseInt(userId), is_active: true }
    });
  }

  async create(data) {
    return prisma.co_travellers.create({ data });
  }

  async update(id, data) {
    return prisma.co_travellers.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id) {
    return prisma.co_travellers.update({
      where: { id: parseInt(id) },
      data: { is_active: false }
    });
  }
}

module.exports = new TravellerRepository();
