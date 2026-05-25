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
          message: translateErrorMessage(detail),
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

function translateErrorMessage(detail) {
  const { type, context } = detail;
  
  switch (type) {
    case 'any.required':
      return `${context.label}为必填项`;
    case 'string.empty':
      return `${context.label}不能为空`;
    case 'string.min':
      return `${context.label}长度不能少于 ${context.limit} 个字符`;
    case 'string.max':
      return `${context.label}长度不能超过 ${context.limit} 个字符`;
    case 'string.pattern.base':
      return context.label === '用户名' 
        ? '用户名格式不正确，仅支持字母、数字、下划线和连字符，且必须以字母开头'
        : context.label === '密码'
        ? '密码长度至少 8 位，且需包含字母和数字'
        : context.label === '手机号'
        ? '请输入有效的手机号码'
        : `${context.label}格式不正确`;
    case 'string.email':
      return '请输入有效的邮箱地址';
    case 'number.base':
      return `${context.label}必须是数字`;
    case 'any.only':
      if (context.label === '状态') {
        return '状态只能是 0 (禁用) 或 1 (启用)';
      }
      return `${context.label}必须是以下值之一: ${context.valids.join(', ')}`;
    default:
      return detail.message;
  }
}

function validateQuery(schema) {
  return validate(schema, 'query');
}

function validateParams(schema) {
  return validate(schema, 'params');
}

const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const phonePattern = /^(1[3-9]\d{9}|\+[1-9]\d{1,14})$/;
const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d).+$/;

const schemas = {
  id: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': '无效的ID格式',
    }),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  login: Joi.object({
    username: Joi.string().required().label('用户名'),
    password: Joi.string().required().label('密码'),
  }),

  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(usernamePattern)
      .required()
      .label('用户名')
      .messages({
        'string.pattern.base': '用户名格式不正确，仅支持字母、数字、下划线和连字符，且必须以字母开头',
      }),
    email: Joi.string().email().max(100).required().label('邮箱'),
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(passwordPattern)
      .required()
      .label('密码')
      .messages({
        'string.pattern.base': '密码长度至少 8 位，且需包含字母和数字',
      }),
    fullName: Joi.string().max(100).required().label('姓名'),
  }),

  userCreate: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(usernamePattern)
      .required()
      .label('用户名')
      .messages({
        'string.pattern.base': '用户名格式不正确，仅支持字母、数字、下划线和连字符，且必须以字母开头',
      }),
    email: Joi.string().email().max(100).allow(null, '').label('邮箱'),
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(passwordPattern)
      .required()
      .label('密码')
      .messages({
        'string.pattern.base': '密码长度至少 8 位，且需包含字母和数字',
      }),
    fullName: Joi.string().max(100).required().label('姓名'),
    phone: Joi.string()
      .max(20)
      .pattern(phonePattern)
      .allow('')
      .label('手机号')
      .messages({
        'string.pattern.base': '请输入有效的手机号码',
      }),
    status: Joi.number().integer().valid(0, 1).label('状态').messages({
      'any.only': '状态只能是 0 (禁用) 或 1 (启用)',
    }),
    roleIds: Joi.array().items(Joi.string().uuid()),
  }),

  userUpdate: Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .pattern(usernamePattern)
      .label('用户名')
      .messages({
        'string.pattern.base': '用户名格式不正确，仅支持字母、数字、下划线和连字符，且必须以字母开头',
      }),
    email: Joi.string().email().max(100).allow(null, '').label('邮箱'),
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(passwordPattern)
      .label('密码')
      .messages({
        'string.pattern.base': '密码长度至少 8 位，且需包含字母和数字',
      }),
    fullName: Joi.string().max(100).label('姓名'),
    phone: Joi.string()
      .max(20)
      .pattern(phonePattern)
      .allow('')
      .label('手机号')
      .messages({
        'string.pattern.base': '请输入有效的手机号码',
      }),
    status: Joi.number().integer().valid(0, 1).label('状态').messages({
      'any.only': '状态只能是 0 (禁用) 或 1 (启用)',
    }),
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
