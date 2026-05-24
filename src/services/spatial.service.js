const { SpatialData, MapLayer } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');
const { sequelize } = require('../../database/connection');

class SpatialService {
  async getSpatialData(tenantId, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dataType,
      layer,
      source,
      bbox,
      search,
    } = options;

    const where = { tenantId };
    if (dataType) where.dataType = dataType;
    if (layer) where.layer = layer;
    if (source) where.source = source;

    if (search) {
      where.name = { [require('sequelize').Op.like]: `%${search}%` };
    }

    const cacheKey = cacheService.getKey('spatial', tenantId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let queryOptions = {
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    };

    if (bbox) {
      const [minX, minY, maxX, maxY] = bbox.split(',').map(Number);
      queryOptions.where.geometry = sequelize.fn(
        'ST_Intersects',
        sequelize.col('geometry'),
        sequelize.fn(
          'ST_MakeEnvelope',
          minX, minY, maxX, maxY,
          4326
        )
      );
    }

    const { count, rows } = await SpatialData.findAndCountAll(queryOptions);

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  async getSpatialDataById(tenantId, id) {
    const cacheKey = cacheService.getKey('spatial_item', tenantId, id);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const data = await SpatialData.findOne({
      where: { id, tenantId },
    });

    if (!data) {
      throw new NotFoundError('Spatial data not found');
    }

    await cacheService.set(cacheKey, data.toJSON(), 300);
    return data;
  }

  async createSpatialData(tenantId, spatialData) {
    const data = await SpatialData.create({
      id: generateId(),
      tenantId,
      ...spatialData,
    });

    await this.invalidateCache(tenantId);
    return data;
  }

  async batchCreateSpatialData(tenantId, features, source = 'IMPORT') {
    const records = features.map((feature) => ({
      id: generateId(),
      tenantId,
      name: feature.properties?.name || `Feature_${Date.now()}`,
      dataType: feature.geometry.type,
      geometry: feature.geometry,
      attributes: feature.properties,
      source,
    }));

    const result = await SpatialData.bulkCreate(records, {
      ignoreDuplicates: true,
      validate: true,
    });

    await this.invalidateCache(tenantId);
    return result;
  }

  async updateSpatialData(tenantId, id, updateData) {
    const data = await this.getSpatialDataById(tenantId, id);

    await data.update(updateData);

    await this.invalidateCache(tenantId, id);
    return data;
  }

  async deleteSpatialData(tenantId, id) {
    const data = await this.getSpatialDataById(tenantId, id);
    await data.destroy();

    await this.invalidateCache(tenantId, id);
    return true;
  }

  async queryByGeometry(tenantId, geometry, options = {}) {
    const { dataType, layer, distance = 0 } = options;

    const where = { tenantId };
    if (dataType) where.dataType = dataType;
    if (layer) where.layer = layer;

    let results;
    if (distance > 0) {
      results = await SpatialData.findAll({
        where: {
          ...where,
          [require('sequelize').Op.and]: sequelize.where(
            sequelize.fn('ST_Distance_Sphere', sequelize.col('geometry'), geometry),
            '<=',
            distance
          ),
        },
        limit: 100,
      });
    } else {
      results = await SpatialData.findAll({
        where: {
          ...where,
          geometry: sequelize.fn('ST_Intersects', sequelize.col('geometry'), geometry),
        },
        limit: 100,
      });
    }

    return results;
  }

  async getMapLayers(tenantId) {
    const cacheKey = cacheService.getKey('map_layers', tenantId);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const layers = await MapLayer.findAll({
      where: { tenantId },
      order: [['sortOrder', 'ASC']],
    });

    await cacheService.set(cacheKey, layers, 600);
    return layers;
  }

  async createMapLayer(tenantId, layerData) {
    const layer = await MapLayer.create({
      id: generateId(),
      tenantId,
      ...layerData,
    });

    await cacheService.del(cacheService.getKey('map_layers', tenantId));
    return layer;
  }

  async updateMapLayer(tenantId, id, updateData) {
    const layer = await MapLayer.findOne({
      where: { id, tenantId },
    });

    if (!layer) {
      throw new NotFoundError('Map layer not found');
    }

    await layer.update(updateData);

    await cacheService.del(cacheService.getKey('map_layers', tenantId));
    return layer;
  }

  async deleteMapLayer(tenantId, id) {
    const layer = await MapLayer.findOne({
      where: { id, tenantId },
    });

    if (!layer) {
      throw new NotFoundError('Map layer not found');
    }

    await layer.destroy();

    await cacheService.del(cacheService.getKey('map_layers', tenantId));
    return true;
  }

  async invalidateCache(tenantId, id = null) {
    await cacheService.delByPattern(`spatial:${tenantId}:*`);
    if (id) {
      await cacheService.del(cacheService.getKey('spatial_item', tenantId, id));
    }
  }
}

module.exports = new SpatialService();
