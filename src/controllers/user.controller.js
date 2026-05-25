const UserService = require('../services/user.service');

class UserController {
  async listUsers(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      const result = await UserService.listUsers(tenantId, req.query);
      res.json({ code: 200, message: 'Success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      const user = await UserService.getUser(tenantId, req.params.id);
      res.json({ code: 200, message: 'Success', data: user });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      const user = await UserService.createUser(tenantId, req.body);
      res.status(201).json({ code: 201, message: 'User created successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      const user = await UserService.updateUser(tenantId, req.params.id, req.body);
      res.json({ code: 200, message: 'User updated successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      await UserService.deleteUser(tenantId, req.params.id);
      res.json({ code: 200, message: 'User deleted successfully', data: null });
    } catch (error) {
      next(error);
    }
  }

  async listRoles(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      const roles = await UserService.listRoles(tenantId);
      res.json({ code: 200, message: 'Success', data: roles });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();