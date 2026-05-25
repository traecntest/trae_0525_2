const Joi = require('joi');
const { ValidationError } = require('./error');
const logger = require('../../config/logger');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    try {
      const data = req[source];
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
        throw new ValidationError('Validation failed', errors);
      }

      req[source] = value;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function validateQuery(schema) {
  return validate(schema, 'query');
}

function validateParams(schema) {
  return validate(schema, 'params');
}

const schemas = {
  id: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  register: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    fullName: Joi.string().max(100),
  }),

  userCreate: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().allow(null, ''),
    password: Joi.string().min(6).max(100).required(),
    fullName: Joi.string().max(100),
    phone: Joi.string().max(20),
    status: Joi.number().integer().valid(0, 1),
    roleIds: Joi.array().items(Joi.string().uuid()),
  }),

  userUpdate: Joi.object({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email().allow(null, ''),
    password: Joi.string().min(6).max(100),
    fullName: Joi.string().max(100),
    phone: Joi.string().max(20),
    status: Joi.number().integer().valid(0, 1),
    roleIds: Joi.array().items(Joi.string().uuid()),
  }),

  model: Joi.object({
    name: Joi.string().required(),
    code: Joi.string(),
    modelType: Joi.string()
      .valid('BIM', 'GIS', 'POINTCLOUD', 'OBLIQUE', '3DMODEL', 'OTHER')
      .default('3DMODEL'),
    categoryId: Joi.string().uuid().required(),
    description: Joi.string().allow(''),
    tags: Joi.array().items(Joi.string()),
    metadata: Joi.object(),
    srid: Joi.number().integer().default(4326),
  }),

  modelVersion: Joi.object({
    changelog: Joi.string().allow(''),
  }),

  spatialData: Joi.object({
    name: Joi.string().required(),
    dataType: Joi.string()
      .valid(
        'POINT',
        'LINESTRING',
        'POLYGON',
        'MULTIPOINT',
        'MULTILINESTRING',
        'MULTIPOLYGON',
        'GEOMETRYCOLLECTION'
      )
      .required(),
    geometry: Joi.object().required(),
    attributes: Joi.object(),
    layer: Joi.string(),
    style: Joi.object(),
    tags: Joi.array().items(Joi.string()),
  }),

  iotDevice: Joi.object({
    deviceCode: Joi.string().required(),
    name: Joi.string().required(),
    deviceType: Joi.string()
      .valid('CAMERA', 'SENSOR', 'ACTUATOR', 'GATEWAY', 'CONTROLLER', 'OTHER')
      .required(),
    protocol: Joi.string()
      .valid('MQTT', 'HTTP', 'MODBUS', 'COAP', 'ZIGBEE', 'OTHER')
      .default('MQTT'),
    config: Joi.object(),
    capabilities: Joi.object(),
    tags: Joi.array().items(Joi.string()),
  }),

  sensorData: Joi.object({
    deviceId: Joi.string().uuid().required(),
    metricCode: Joi.string().required(),
    value: Joi.number().required(),
    unit: Joi.string(),
    timestamp: Joi.date().required(),
  }),

  event: Joi.object({
    eventType: Joi.string()
      .valid('ALERT', 'INCIDENT', 'MAINTENANCE', 'OPERATION', 'OTHER')
      .required(),
    severity: Joi.string()
      .valid('INFO', 'WARNING', 'MINOR', 'MAJOR', 'CRITICAL')
      .default('INFO'),
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    eventTime: Joi.date().required(),
    relatedModelId: Joi.string().uuid().allow(null),
    relatedDeviceId: Joi.string().uuid().allow(null),
  }),

  businessObject: Joi.object({
    objectType: Joi.string()
      .valid(
        'PROJECT',
        'BUILDING',
        'INFRASTRUCTURE',
        'LAND',
        'ASSET',
        'FACILITY',
        'OTHER'
      )
      .required(),
    name: Joi.string().required(),
    code: Joi.string(),
    description: Joi.string().allow(''),
    status: Joi.string()
      .valid(
        'PLANNING',
        'DESIGN',
        'CONSTRUCTION',
        'OPERATION',
        'MAINTENANCE',
        'DEMOLISHED'
      )
      .default('PLANNING'),
    startDate: Joi.date().allow(null),
    endDate: Joi.date().allow(null),
    attributes: Joi.object(),
    tags: Joi.array().items(Joi.string()),
  }),

  scene: Joi.object({
    name: Joi.string().required(),
    code: Joi.string(),
    description: Joi.string().allow(''),
    modelIds: Joi.array().items(Joi.string().uuid()),
    initialView: Joi.object(),
    backgroundColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#87CEEB'),
    ambientIntensity: Joi.number().min(0).max(1).default(0.5),
    tags: Joi.array().items(Joi.string()),
  }),
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  schemas,
};
