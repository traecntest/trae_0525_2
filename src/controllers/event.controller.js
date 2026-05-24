const EventService = require('../services/event.service');

class EventController {
  async getEvents(req, res, next) {
    try {
      const result = await EventService.getEvents(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req, res, next) {
    try {
      const event = await EventService.getEventById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req, res, next) {
    try {
      const event = await EventService.createEvent(
        req.tenantId,
        req.body,
        req.userId
      );

      res.status(201).json({
        code: 201,
        message: 'Event created',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const event = await EventService.updateEvent(
        req.tenantId,
        req.params.id,
        req.body,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Event updated',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeEvent(req, res, next) {
    try {
      const event = await EventService.acknowledgeEvent(
        req.tenantId,
        req.params.id,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Event acknowledged',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveEvent(req, res, next) {
    try {
      const event = await EventService.resolveEvent(
        req.tenantId,
        req.params.id,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Event resolved',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignEvent(req, res, next) {
    try {
      const event = await EventService.assignEvent(
        req.tenantId,
        req.params.id,
        req.body.assignedTo,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Event assigned',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      await EventService.deleteEvent(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Event deleted',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventStats(req, res, next) {
    try {
      const stats = await EventService.getEventStats(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
