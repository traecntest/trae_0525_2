const { TemporalModel } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');

class TemporalService {
  async getTemporalStates(tenantId, modelId, options = {}) {
    const {
      page = 1,
      limit = 50,
      timeType,
      startTime,
      endTime,
    } = options;

    const where = { tenantId, modelId };
    if (timeType) where.timeType = timeType;

    if (startTime || endTime) {
      where.timeStart = {};
      if (startTime) where.timeStart[require('sequelize').Op.gte] = new Date(startTime);
      if (endTime) {
        where.timeStart[require('sequelize').Op.lte] = new Date(endTime);
        where.timeEnd = { [require('sequelize').Op.lte]: new Date(endTime) };
      }
    }

    const { count, rows } = await TemporalModel.findAndCountAll({
      where,
      order: [['timeStart', 'ASC']],
      offset: (page - 1) * limit,
      limit,
    });

    return buildPaginationResponse(rows, count, page, limit);
  }

  async getTemporalStateById(tenantId, id) {
    const state = await TemporalModel.findOne({
      where: { id, tenantId },
    });

    if (!state) {
      throw new NotFoundError('Temporal state not found');
    }

    return state;
  }

  async createTemporalState(tenantId, temporalData) {
    const state = await TemporalModel.create({
      id: generateId(),
      tenantId,
      ...temporalData,
    });

    return state;
  }

  async getStateAtTime(tenantId, modelId, timestamp) {
    const targetTime = new Date(timestamp);

    const state = await TemporalModel.findOne({
      where: {
        tenantId,
        modelId,
        timeStart: { [require('sequelize').Op.lte]: targetTime },
        [require('sequelize').Op.or]: [
          { timeEnd: null },
          { timeEnd: { [require('sequelize').Op.gte]: targetTime } },
        ],
      },
      order: [['timeStart', 'DESC']],
    });

    return state;
  }

  async getHistoricalTimeline(tenantId, modelId, startTime, endTime) {
    const where = {
      tenantId,
      modelId,
      timeType: 'HISTORICAL',
    };

    if (startTime) where.timeStart = { [require('sequelize').Op.gte]: new Date(startTime) };
    if (endTime) {
      where.timeStart = {
        ...where.timeStart,
        [require('sequelize').Op.lte]: new Date(endTime),
      };
    }

    const states = await TemporalModel.findAll({
      where,
      order: [['timeStart', 'ASC']],
      limit: 1000,
    });

    return states;
  }

  async deleteTemporalState(tenantId, id) {
    const state = await this.getTemporalStateById(tenantId, id);
    await state.update({ status: 'ARCHIVED' });

    return true;
  }
}

module.exports = new TemporalService();
