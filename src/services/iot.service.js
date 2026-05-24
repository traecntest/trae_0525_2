const { IotDevice, SensorData } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError, ConflictError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');
const logger = require('../../config/logger');

class IotService {
  async getDevices(tenantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      deviceType,
      status,
      search,
    } = options;

    const where = { tenantId };
    if (deviceType) where.deviceType = deviceType;
    if (status) where.status = status;

    if (search) {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { deviceCode: { [require('sequelize').Op.like]: `%${search}%` } },
      ];
    }

    const cacheKey = cacheService.getKey('devices', tenantId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { count, rows } = await IotDevice.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    });

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 60);

    return result;
  }

  async getDeviceById(tenantId, deviceId) {
    const cacheKey = cacheService.getKey('device', tenantId, deviceId);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const device = await IotDevice.findOne({
      where: { id: deviceId, tenantId },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    await cacheService.set(cacheKey, device.toJSON(), 60);
    return device;
  }

  async createDevice(tenantId, deviceData) {
    const existingDevice = await IotDevice.findOne({
      where: { tenantId, deviceCode: deviceData.deviceCode },
    });

    if (existingDevice) {
      throw new ConflictError('Device code already exists');
    }

    const device = await IotDevice.create({
      id: generateId(),
      tenantId,
      ...deviceData,
    });

    await this.invalidateCache(tenantId);
    return device;
  }

  async updateDevice(tenantId, deviceId, updateData) {
    const device = await this.getDeviceById(tenantId, deviceId);

    if (updateData.deviceCode && updateData.deviceCode !== device.deviceCode) {
      const existingDevice = await IotDevice.findOne({
        where: { tenantId, deviceCode: updateData.deviceCode },
      });
      if (existingDevice) {
        throw new ConflictError('Device code already exists');
      }
    }

    await device.update(updateData);

    await this.invalidateCache(tenantId, deviceId);
    return device;
  }

  async deleteDevice(tenantId, deviceId) {
    const device = await this.getDeviceById(tenantId, deviceId);

    await SensorData.destroy({ where: { deviceId, tenantId } });
    await device.destroy();

    await this.invalidateCache(tenantId, deviceId);
    return true;
  }

  async updateDeviceStatus(tenantId, deviceId, status) {
    const device = await this.getDeviceById(tenantId, deviceId);
    await device.update({ status, lastHeartbeat: new Date() });

    await this.invalidateCache(tenantId, deviceId);
    return device;
  }

  async addSensorData(tenantId, deviceId, data) {
    const device = await this.getDeviceById(tenantId, deviceId);

    if (device.status === 'OFFLINE') {
      await device.update({ status: 'ONLINE' });
    }

    const sensorData = await SensorData.create({
      tenantId,
      deviceId,
      ...data,
    });

    const cacheKey = cacheService.getKey('sensor_data', deviceId);
    await cacheService.del(cacheKey);

    return sensorData;
  }

  async addSensorDataBatch(tenantId, deviceId, dataList) {
    const device = await this.getDeviceById(tenantId, deviceId);

    if (device.status === 'OFFLINE') {
      await device.update({ status: 'ONLINE' });
    }

    const records = dataList.map((data) => ({
      tenantId,
      deviceId,
      ...data,
    }));

    const sensorData = await SensorData.bulkCreate(records, { ignoreDuplicates: true });

    const cacheKey = cacheService.getKey('sensor_data', deviceId);
    await cacheService.del(cacheKey);

    return sensorData;
  }

  async getSensorData(tenantId, deviceId, options = {}) {
    const {
      page = 1,
      limit = 100,
      metricCode,
      startTime,
      endTime,
      aggregation,
    } = options;

    const where = { tenantId, deviceId };
    if (metricCode) where.metricCode = metricCode;

    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp[require('sequelize').Op.gte] = new Date(startTime);
      if (endTime) where.timestamp[require('sequelize').Op.lte] = new Date(endTime);
    }

    const cacheKey = cacheService.getKey('sensor_data', deviceId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    if (aggregation) {
      const { Op, fn, col, literal } = require('sequelize');
      const groupField = aggregation === 'hour'
        ? literal("DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')")
        : aggregation === 'day'
          ? literal("DATE(timestamp)")
          : 'metricCode';

      const result = await SensorData.findAll({
        where,
        attributes: [
          'metricCode',
          [fn('AVG', col('value')), 'avgValue'],
          [fn('MIN', col('value')), 'minValue'],
          [fn('MAX', col('value')), 'maxValue'],
          [fn('COUNT', col('value')), 'count'],
          [groupField, 'timeBucket'],
        ],
        group: ['metricCode', groupField.field || groupField],
        order: [['timestamp', 'DESC']],
        limit,
      });

      await cacheService.set(cacheKey, result, 30);
      return result;
    }

    const { count, rows } = await SensorData.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    });

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 30);

    return result;
  }

  async getLatestSensorData(tenantId, deviceId, metricCode = null) {
    const where = { tenantId, deviceId };
    if (metricCode) where.metricCode = metricCode;

    const cacheKey = cacheService.getKey('latest_sensor', deviceId, metricCode || 'all');
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const metrics = await SensorData.findAll({
      where,
      attributes: ['metricCode', 'value', 'unit', 'timestamp', 'quality'],
      order: [['timestamp', 'DESC']],
      limit: 50,
      distinct: true,
    });

    const latest = {};
    metrics.forEach((m) => {
      if (!latest[m.metricCode]) {
        latest[m.metricCode] = {
          metricCode: m.metricCode,
          value: m.value,
          unit: m.unit,
          timestamp: m.timestamp,
          quality: m.quality,
        };
      }
    });

    const result = Object.values(latest);
    await cacheService.set(cacheKey, result, 10);

    return result;
  }

  async invalidateCache(tenantId, deviceId = null) {
    await cacheService.delByPattern(`devices:${tenantId}:*`);
    if (deviceId) {
      await cacheService.del(cacheService.getKey('device', tenantId, deviceId));
      await cacheService.delByPattern(`sensor_data:${deviceId}:*`);
      await cacheService.delByPattern(`latest_sensor:${deviceId}:*`);
    }
  }
}

module.exports = new IotService();
