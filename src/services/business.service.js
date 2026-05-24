const { BusinessObject } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');

class BusinessService {
  async getObjects(tenantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      objectType,
      status,
      search,
    } = options;

    const where = { tenantId };
    if (objectType) where.objectType = objectType;
    if (status) where.status = status;

    if (search) {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { code: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
      ];
    }

    const cacheKey = cacheService.getKey('business', tenantId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { count, rows } = await BusinessObject.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    });

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  async getObjectById(tenantId, id) {
    const cacheKey = cacheService.getKey('business_item', tenantId, id);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const object = await BusinessObject.findOne({
      where: { id, tenantId },
    });

    if (!object) {
      throw new NotFoundError('Business object not found');
    }

    await cacheService.set(cacheKey, object.toJSON(), 300);
    return object;
  }

  async createObject(tenantId, objectData, userId) {
    const object = await BusinessObject.create({
      id: generateId(),
      tenantId,
      createdBy: userId,
      ...objectData,
    });

    await this.invalidateCache(tenantId);
    return object;
  }

  async updateObject(tenantId, id, updateData, userId) {
    const object = await this.getObjectById(tenantId, id);

    await object.update(updateData);

    await this.invalidateCache(tenantId, id);
    return object;
  }

  async deleteObject(tenantId, id) {
    const object = await this.getObjectById(tenantId, id);
    await object.destroy();

    await this.invalidateCache(tenantId, id);
    return true;
  }

  async getStats(tenantId) {
    const cacheKey = cacheService.getKey('business_stats', tenantId);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { Op, fn, col } = require('sequelize');

    const stats = await BusinessObject.findAll({
      where: { tenantId },
      attributes: [
        'objectType',
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('area')), 'totalArea'],
        [fn('SUM', col('floorArea')), 'totalFloorArea'],
      ],
      group: ['objectType', 'status'],
    });

    await cacheService.set(cacheKey, stats, 300);
    return stats;
  }

  async invalidateCache(tenantId, id = null) {
    await cacheService.delByPattern(`business:${tenantId}:*`);
    if (id) {
      await cacheService.del(cacheService.getKey('business_item', tenantId, id));
    }
  }
}

module.exports = new BusinessService();
