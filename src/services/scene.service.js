const { ModelScene } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');

class SceneService {
  async getScenes(tenantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search,
    } = options;

    const where = { tenantId };
    if (status) where.status = status;

    if (search) {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { code: { [require('sequelize').Op.like]: `%${search}%` } },
      ];
    }

    const cacheKey = cacheService.getKey('scenes', tenantId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { count, rows } = await ModelScene.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    });

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  async getSceneById(tenantId, sceneId) {
    const cacheKey = cacheService.getKey('scene', tenantId, sceneId);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const scene = await ModelScene.findOne({
      where: { id: sceneId, tenantId },
    });

    if (!scene) {
      throw new NotFoundError('Scene not found');
    }

    await cacheService.set(cacheKey, scene.toJSON(), 300);
    return scene;
  }

  async createScene(tenantId, sceneData, userId) {
    const scene = await ModelScene.create({
      id: generateId(),
      tenantId,
      createdBy: userId,
      ...sceneData,
    });

    await this.invalidateCache(tenantId);
    return scene;
  }

  async updateScene(tenantId, sceneId, updateData, userId) {
    const scene = await this.getSceneById(tenantId, sceneId);

    await scene.update(updateData);

    await this.invalidateCache(tenantId, sceneId);
    return scene;
  }

  async deleteScene(tenantId, sceneId) {
    const scene = await this.getSceneById(tenantId, sceneId);
    await scene.destroy();

    await this.invalidateCache(tenantId, sceneId);
    return true;
  }

  async publishScene(tenantId, sceneId, userId) {
    return this.updateScene(tenantId, sceneId, { status: 'PUBLISHED' }, userId);
  }

  async archiveScene(tenantId, sceneId, userId) {
    return this.updateScene(tenantId, sceneId, { status: 'ARCHIVED' }, userId);
  }

  async addModelsToScene(tenantId, sceneId, modelIds, userId) {
    const scene = await this.getSceneById(tenantId, sceneId);

    const currentModelIds = scene.modelIds || [];
    const newModelIds = [...new Set([...currentModelIds, ...modelIds])];

    await scene.update({ modelIds: newModelIds });

    await this.invalidateCache(tenantId, sceneId);
    return scene;
  }

  async removeModelsFromScene(tenantId, sceneId, modelIds, userId) {
    const scene = await this.getSceneById(tenantId, sceneId);

    const currentModelIds = scene.modelIds || [];
    const newModelIds = currentModelIds.filter((id) => !modelIds.includes(id));

    await scene.update({ modelIds: newModelIds });

    await this.invalidateCache(tenantId, sceneId);
    return scene;
  }

  async invalidateCache(tenantId, sceneId = null) {
    await cacheService.delByPattern(`scenes:${tenantId}:*`);
    if (sceneId) {
      await cacheService.del(cacheService.getKey('scene', tenantId, sceneId));
    }
  }
}

module.exports = new SceneService();
