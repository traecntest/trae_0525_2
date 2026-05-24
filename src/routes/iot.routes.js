const express = require('express');
const IotController = require('../controllers/iot.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validate, validateQuery, validateParams, schemas } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

router.get('/devices', validateQuery(schemas.pagination), IotController.getDevices);
router.get('/devices/:id', validateParams(schemas.id), IotController.getDeviceById);
router.post('/devices', requirePermission('iot:write'), validate(schemas.iotDevice), IotController.createDevice);
router.put('/devices/:id', requirePermission('iot:write'), validateParams(schemas.id), IotController.updateDevice);
router.delete('/devices/:id', requirePermission('iot:delete'), validateParams(schemas.id), IotController.deleteDevice);
router.patch('/devices/:id/status', requirePermission('iot:write'), validateParams(schemas.id), IotController.updateDeviceStatus);

router.get('/devices/:deviceId/sensor-data', IotController.getSensorData);
router.get('/devices/:deviceId/sensor-data/latest', IotController.getLatestSensorData);
router.post('/devices/:deviceId/sensor-data', requirePermission('iot:write'), validate(schemas.sensorData), IotController.addSensorData);
router.post('/devices/:deviceId/sensor-data/batch', requirePermission('iot:write'), IotController.addSensorDataBatch);

module.exports = router;
