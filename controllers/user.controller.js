const userService = require('../services/user.service');

class UserController {
  async getAll(req, res, next) {
    try {
      const data = await userService.getAllUsers();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await userService.getUserById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await userService.createUser(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
