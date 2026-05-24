const { User, Role, UserRole, Tenant } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { NotFoundError, BadRequestError, UnauthorizedError, ConflictError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');
const logger = require('../../config/logger');

class AuthService {
  async login(tenantId, username, password, ipAddress) {
    const user = await User.scope('withPassword').findOne({
      where: { tenantId, username },
      include: [{ association: 'roles' }],
    });

    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    if (user.status !== 1) {
      throw new UnauthorizedError('Account is disabled');
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    await user.update({
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const cacheKey = cacheService.getKey('refresh_token', user.id);
    await cacheService.set(cacheKey, refreshToken, 7 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        roles: user.roles?.map((r) => ({ id: r.id, code: r.code, name: r.name })),
      },
    };
  }

  async register(tenantId, userData) {
    const existingUser = await User.findOne({
      where: {
        tenantId,
        [require('sequelize').Op.or]: [
          { username: userData.username },
          { email: userData.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictError('Username or email already exists');
    }

    const user = await User.create({
      id: generateId(),
      tenantId,
      ...userData,
    });

    const viewerRole = await Role.findOne({
      where: { tenantId, code: 'viewer' },
    });

    if (viewerRole) {
      await UserRole.create({
        userId: user.id,
        roleId: viewerRole.id,
        tenantId,
      });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    };
  }

  async refreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const cacheKey = cacheService.getKey('refresh_token', decoded.id);
    const cachedToken = await cacheService.get(cacheKey);

    if (!cachedToken || cachedToken !== refreshToken) {
      throw new UnauthorizedError('Refresh token expired or revoked');
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ association: 'roles' }],
    });

    if (!user || user.status !== 1) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const newAccessToken = generateAccessToken(user);
    return { accessToken: newAccessToken };
  }

  async logout(userId) {
    const cacheKey = cacheService.getKey('refresh_token', userId);
    await cacheService.del(cacheKey);
    return true;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await user.validatePassword(oldPassword);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    await user.update({ password: newPassword });

    const cacheKey = cacheService.getKey('refresh_token', userId);
    await cacheService.del(cacheKey);

    return true;
  }
}

module.exports = new AuthService();
