const userRepository = require('../repositories/user.repository');

class UserService {
  async getAllUsers() {
    return userRepository.findAll();
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async createUser(data) {
    return userRepository.create(data);
  }

  async updateUser(id, data) {
    return userRepository.update(id, data);
  }

  async deleteUser(id) {
    return userRepository.delete(id);
  }
}

module.exports = new UserService();
