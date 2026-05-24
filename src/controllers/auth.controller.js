const AuthService = require('../services/auth.service');
const { getIpAddress } = require('../middleware/audit');

class AuthController {
  async login(req, res, next) {
    try {
      const { tenantId, username, password } = {
        tenantId: req.headers['x-tenant-id'] || 'default',
        ...req.body,
      };
      const ipAddress = getIpAddress(req);

      const result = await AuthService.login(tenantId, username, password, ipAddress);

      res.json({
        code: 200,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default';
      const user = await AuthService.register(tenantId, req.body);

      res.status(201).json({
        code: 201,
        message: 'Registration successful',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        code: 200,
        message: 'Token refreshed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.userId);

      res.json({
        code: 200,
        message: 'Logout successful',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await AuthService.changePassword(req.userId, oldPassword, newPassword);

      res.json({
        code: 200,
        message: 'Password changed successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = req.user;

      res.json({
        code: 200,
        message: 'Success',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          phone: user.phone,
          roles: user.roles?.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            permissions: r.permissions,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
