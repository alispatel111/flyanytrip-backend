const prisma = require('../config/prisma');

class UserRepository {
  async findAll() {
    return prisma.users.findMany({
      select: { id: true, email: true, first_name: true, last_name: true, phone: true, user_type: true }
    });
  }

  async findById(id) {
    return prisma.users.findUnique({
      where: { id: parseInt(id) }
    });
  }

  async create(data) {
    return prisma.users.create({ data });
  }

  async update(id, data) {
    return prisma.users.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id) {
    return prisma.users.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = new UserRepository();
