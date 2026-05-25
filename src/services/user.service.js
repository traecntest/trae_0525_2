const { User, Role, UserRole } = require('../models');
const { generateId } = require('../utils/helpers');
const { NotFoundError, BadRequestError, ConflictError } = require('../middleware/error');
const bcrypt = require('bcryptjs');

class UserService {
  async listUsers(tenantId, filters = {}) {
    const { page = 1, limit = 10, keyword, status, roleId } = filters;
    const offset = (page - 1) * limit;

    const where = { tenantId };

    if (keyword) {
      where[require('sequelize').Op.or] = [
        { username: { [require('sequelize').Op.like]: `%${keyword}%` } },
        { email: { [require('sequelize').Op.like]: `%${keyword}%` } },
        { fullName: { [require('sequelize').Op.like]: `%${keyword}%` } },
      ];
    }

    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }

    const include = [{
      association: 'roles',
      through: { attributes: [] },
    }];

    if (roleId) {
      include[0].where = { id: roleId };
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] },
    });

    return {
      count,
      rows: rows.map((u) => ({
        ...u.toJSON(),
        roles: u.roles?.map((r) => ({ id: r.id, code: r.code, name: r.name })) || [],
      })),
    };
  }

  async getUser(tenantId, userId) {
    const user = await User.findOne({
      where: { id: userId, tenantId },
      include: [{ association: 'roles', through: { attributes: [] } }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user.toJSON(),
      roles: user.roles?.map((r) => ({ id: r.id, code: r.code, name: r.name })) || [],
    };
  }

  async createUser(tenantId, userData) {
    const existing = await User.findOne({
      where: {
        tenantId,
        [require('sequelize').Op.or]: [
          { username: userData.username },
          { email: userData.email },
        ],
      },
    });

    if (existing) {
      throw new ConflictError('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password || '123456', 10);

    const user = await User.create({
      id: generateId('user'),
      tenantId,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      fullName: userData.fullName,
      phone: userData.phone,
      status: userData.status ?? 1,
    });

    if (userData.roleIds?.length) {
      const roles = await Role.findAll({
        where: { id: userData.roleIds, tenantId },
      });
      await user.setRoles(roles);
    } else {
      const viewerRole = await Role.findOne({ where: { tenantId, code: 'viewer' } });
      if (viewerRole) {
        await UserRole.create({
          userId: user.id,
          roleId: viewerRole.id,
          tenantId,
        });
      }
    }

    return this.getUser(tenantId, user.id);
  }

  async updateUser(tenantId, userId, userData) {
    const user = await User.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (userData.username && userData.username !== user.username) {
      const existing = await User.findOne({
        where: { username: userData.username, tenantId },
      });
      if (existing) {
        throw new ConflictError('Username already exists');
      }
    }

    if (userData.email && userData.email !== user.email) {
      const existing = await User.findOne({
        where: { email: userData.email, tenantId },
      });
      if (existing) {
        throw new ConflictError('Email already exists');
      }
    }

    const updateData = {};
    if (userData.username) updateData.username = userData.username;
    if (userData.email) updateData.email = userData.email;
    if (userData.fullName !== undefined) updateData.fullName = userData.fullName;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.status !== undefined) updateData.status = userData.status;
    if (userData.password) updateData.password = await bcrypt.hash(userData.password, 10);

    await user.update(updateData);

    if (userData.roleIds) {
      const roles = await Role.findAll({
        where: { id: userData.roleIds, tenantId },
      });
      await user.setRoles(roles);
    }

    return this.getUser(tenantId, userId);
  }

  async deleteUser(tenantId, userId) {
    const user = await User.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.username === 'admin') {
      throw new BadRequestError('Cannot delete admin user');
    }

    await user.destroy();
    return true;
  }

  async listRoles(tenantId) {
    const roles = await Role.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
    });
    return roles;
  }
}

module.exports = new UserService();