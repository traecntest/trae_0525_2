const { Event } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');
const taskQueue = require('../queue/task-queue');

class EventService {
  async getEvents(tenantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'eventTime',
      sortOrder = 'desc',
      eventType,
      severity,
      status,
      startTime,
      endTime,
      assignedTo,
      search,
    } = options;

    const where = { tenantId };
    if (eventType) where.eventType = eventType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    if (startTime || endTime) {
      where.eventTime = {};
      if (startTime) where.eventTime[require('sequelize').Op.gte] = new Date(startTime);
      if (endTime) where.eventTime[require('sequelize').Op.lte] = new Date(endTime);
    }

    if (search) {
      where[require('sequelize').Op.or] = [
        { title: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
      ];
    }

    const cacheKey = cacheService.getKey('events', tenantId, JSON.stringify(options));
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { count, rows } = await Event.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    });

    const result = buildPaginationResponse(rows, count, page, limit);
    await cacheService.set(cacheKey, result, 30);

    return result;
  }

  async getEventById(tenantId, eventId) {
    const event = await Event.findOne({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  async createEvent(tenantId, eventData, userId) {
    const event = await Event.create({
      id: generateId(),
      tenantId,
      createdBy: userId,
      ...eventData,
    });

    await this.invalidateCache(tenantId);
    return event;
  }

  async updateEvent(tenantId, eventId, updateData, userId) {
    const event = await this.getEventById(tenantId, eventId);

    if (updateData.status === 'ACKNOWLEDGED' && !event.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    }

    if (updateData.status === 'RESOLVED' || updateData.status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    await event.update(updateData);

    await this.invalidateCache(tenantId, eventId);
    return event;
  }

  async acknowledgeEvent(tenantId, eventId, userId) {
    return this.updateEvent(tenantId, eventId, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    }, userId);
  }

  async resolveEvent(tenantId, eventId, userId) {
    return this.updateEvent(tenantId, eventId, {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    }, userId);
  }

  async assignEvent(tenantId, eventId, assignedTo, userId) {
    return this.updateEvent(tenantId, eventId, { assignedTo }, userId);
  }

  async deleteEvent(tenantId, eventId) {
    const event = await this.getEventById(tenantId, eventId);
    await event.destroy();

    await this.invalidateCache(tenantId, eventId);
    return true;
  }

  async getEventStats(tenantId, options = {}) {
    const { startTime, endTime } = options;

    const where = { tenantId };
    if (startTime) where.eventTime = { [require('sequelize').Op.gte]: new Date(startTime) };
    if (endTime) where.eventTime = { ...where.eventTime, [require('sequelize').Op.lte]: new Date(endTime) };

    const stats = await Event.findAll({
      where,
      attributes: [
        'eventType',
        'severity',
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      ],
      group: ['eventType', 'severity', 'status'],
    });

    return stats;
  }

  async invalidateCache(tenantId, eventId = null) {
    await cacheService.delByPattern(`events:${tenantId}:*`);
  }
}

module.exports = new EventService();
