const IotService = require('../services/iot.service');

class IotController {
  async getDevices(req, res, next) {
    try {
      const result = await IotService.getDevices(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeviceById(req, res, next) {
    try {
      const device = await IotService.getDeviceById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDevice(req, res, next) {
    try {
      const device = await IotService.createDevice(req.tenantId, req.body);

      res.status(201).json({
        code: 201,
        message: 'Device created successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDevice(req, res, next) {
    try {
      const device = await IotService.updateDevice(
        req.tenantId,
        req.params.id,
        req.body
      );

      res.json({
        code: 200,
        message: 'Device updated successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDevice(req, res, next) {
    try {
      await IotService.deleteDevice(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Device deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDeviceStatus(req, res, next) {
    try {
      const device = await IotService.updateDeviceStatus(
        req.tenantId,
        req.params.id,
        req.body.status
      );

      res.json({
        code: 200,
        message: 'Device status updated',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }

  async addSensorData(req, res, next) {
    try {
      const data = await IotService.addSensorData(
        req.tenantId,
        req.params.deviceId,
        req.body
      );

      res.status(201).json({
        code: 201,
        message: 'Sensor data added',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async addSensorDataBatch(req, res, next) {
    try {
      const data = await IotService.addSensorDataBatch(
        req.tenantId,
        req.params.deviceId,
        req.body.data
      );

      res.status(201).json({
        code: 201,
        message: 'Sensor data batch added',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSensorData(req, res, next) {
    try {
      const result = await IotService.getSensorData(
        req.tenantId,
        req.params.deviceId,
        req.query
      );

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLatestSensorData(req, res, next) {
    try {
      const result = await IotService.getLatestSensorData(
        req.tenantId,
        req.params.deviceId,
        req.query.metricCode
      );

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IotController();
