const path = require('path');
const fs = require('fs');
const { Model3D, ModelVersion, ModelLod, ModelCategory } = require('../models');
const { generateId, buildPaginationResponse, parseBoundingBox, calculateCentroid, getFileExtension } = require('../utils/helpers');
const { NotFoundError, BadRequestError, ConflictError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');
const taskQueue = require('../queue/task-queue');
const config = require('../../config/index');
const logger = require('../../config/logger');

class ModelService {
  async getModels(tenantId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', modelType, categoryId, status, search } = options;

    const where = { tenantId };
    if (modelType) where.modelType = modelType;
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    if (search) {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { code: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
      ];
    }

    const cacheKey = cacheService.getKey('models', tenantId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { count, rows } = await Model3D.findAndCountAll({
      where,
      include: [{ association: 'category', attributes: ['id', 'name', 'code'] }],
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    });

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  async getModelById(tenantId, modelId) {
    const cacheKey = cacheService.getKey('model', tenantId, modelId);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const model = await Model3D.findOne({
      where: { id: modelId, tenantId },
      include: [
        { association: 'category', attributes: ['id', 'name', 'code'] },
        { association: 'versions', limit: 10, order: [['version', 'DESC']] },
      ],
    });

    if (!model) {
      throw new NotFoundError('Model not found');
    }

    await cacheService.set(cacheKey, model.toJSON(), 300);
    return model;
  }

  async createModel(tenantId, userId, modelData, fileData) {
    const category = await ModelCategory.findOne({
      where: { id: modelData.categoryId, tenantId },
    });

    if (!category) {
      throw new BadRequestError('Invalid category');
    }

    const existingModel = await Model3D.findOne({
      where: { tenantId, code: modelData.code },
    });

    if (existingModel) {
      throw new ConflictError('Model code already exists');
    }

    const modelId = generateId();
    let filePath = null;
    let fileSize = 0;
    let fileFormat = null;
    let fileName = null;

    if (fileData) {
      fileFormat = getFileExtension(fileData.originalname);
      fileName = fileData.originalname;
      fileSize = fileData.size;
      const uploadDir = path.join(process.cwd(), config.upload.dir, tenantId);
      filePath = path.join(uploadDir, `${modelId}.${fileFormat}`);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.renameSync(fileData.path, filePath);
    }

    const model = await Model3D.create({
      id: modelId,
      tenantId,
      ...modelData,
      filePath,
      fileName,
      fileSize,
      fileFormat,
      status: 'UPLOADING',
      createdBy: userId,
      updatedBy: userId,
    });

    if (fileData) {
      await this.queueModelProcessing(modelId, tenantId, filePath, fileFormat);
    }

    await this.invalidateCache(tenantId);
    return model;
  }

  async updateModel(tenantId, modelId, updateData, userId) {
    const model = await this.getModelById(tenantId, modelId);

    await model.update({
      ...updateData,
      updatedBy: userId,
    });

    await this.invalidateCache(tenantId, modelId);
    return model;
  }

  async deleteModel(tenantId, modelId) {
    const model = await this.getModelById(tenantId, modelId);

    if (model.filePath && fs.existsSync(model.filePath)) {
      fs.unlinkSync(model.filePath);
    }

    await ModelVersion.destroy({ where: { modelId, tenantId } });
    await ModelLod.destroy({ where: { modelId, tenantId } });
    await model.destroy();

    await this.invalidateCache(tenantId, modelId);
    return true;
  }

  async uploadModelVersion(tenantId, modelId, fileData, userId, changelog) {
    const model = await this.getModelById(tenantId, modelId);
    const newVersion = (model.version || 0) + 1;

    const fileFormat = getFileExtension(fileData.originalname);
    const versionId = generateId();

    const uploadDir = path.join(process.cwd(), config.upload.dir, tenantId, 'versions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${modelId}_v${newVersion}.${fileFormat}`);
    fs.renameSync(fileData.path, filePath);

    const version = await ModelVersion.create({
      id: versionId,
      tenantId,
      modelId,
      version: newVersion,
      changelog,
      filePath,
      fileSize: fileData.size,
      status: 'PROCESSING',
      createdBy: userId,
    });

    await model.update({
      version: newVersion,
      totalVersions: (model.totalVersions || 0) + 1,
      updatedBy: userId,
    });

    await this.queueModelProcessing(modelId, tenantId, filePath, fileFormat, versionId);

    await this.invalidateCache(tenantId, modelId);
    return version;
  }

  async getModelVersions(tenantId, modelId) {
    const versions = await ModelVersion.findAll({
      where: { modelId, tenantId },
      order: [['version', 'DESC']],
    });

    return versions;
  }

  async getModelLods(tenantId, modelId, versionId) {
    const where = { modelId, tenantId };
    if (versionId) where.versionId = versionId;

    const lods = await ModelLod.findAll({
      where,
      order: [['lodLevel', 'ASC']],
    });

    return lods;
  }

  async publishModel(tenantId, modelId, userId) {
    const model = await this.getModelById(tenantId, modelId);

    if (model.status !== 'READY') {
      throw new BadRequestError('Model must be in READY status to publish');
    }

    await model.update({
      isPublished: 1,
      publishedAt: new Date(),
      updatedBy: userId,
    });

    await this.invalidateCache(tenantId, modelId);
    return model;
  }

  async unpublishModel(tenantId, modelId, userId) {
    const model = await this.getModelById(tenantId, modelId);

    await model.update({
      isPublished: 0,
      publishedAt: null,
      updatedBy: userId,
    });

    await this.invalidateCache(tenantId, modelId);
    return model;
  }

  async queueModelProcessing(modelId, tenantId, filePath, format, versionId = null) {
    await taskQueue.addTask('model_processing', {
      modelId,
      tenantId,
      filePath,
      format,
      versionId,
    }, {
      priority: 5,
    });

    logger.info(`Model processing queued: ${modelId}`);
  }

  async updateProcessingStatus(modelId, tenantId, status, progress, errorMessage = null, additionalData = {}) {
    const updateData = {
      status,
      processingProgress: progress,
    };

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (additionalData.boundingBox) {
      updateData.boundingBox = additionalData.boundingBox;
    }

    if (additionalData.centroid) {
      updateData.centroid = additionalData.centroid;
    }

    if (additionalData.lodLevels) {
      updateData.lodLevels = additionalData.lodLevels;
    }

    await Model3D.update(updateData, {
      where: { id: modelId, tenantId },
    });

    await this.invalidateCache(tenantId, modelId);
  }

  async invalidateCache(tenantId, modelId = null) {
    await cacheService.delByPattern(`models:${tenantId}:*`);
    if (modelId) {
      await cacheService.del(cacheService.getKey('model', tenantId, modelId));
    }
  }

  async getCategories(tenantId, parentId = null) {
    const where = { tenantId };
    if (parentId !== null) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }

    const categories = await ModelCategory.findAll({
      where,
      include: [{ association: 'children' }],
      order: [['sortOrder', 'ASC']],
    });

    return categories;
  }

  async createCategory(tenantId, categoryData) {
    const existingCategory = await ModelCategory.findOne({
      where: { tenantId, code: categoryData.code },
    });

    if (existingCategory) {
      throw new ConflictError('Category code already exists');
    }

    const category = await ModelCategory.create({
      id: generateId(),
      tenantId,
      ...categoryData,
    });

    return category;
  }
}

module.exports = new ModelService();
