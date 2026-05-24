const { AuditLog } = require('../models');
const logger = require('../../config/logger');

function getIpAddress(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    req.connection?.remoteAddress
  );
}

function getUserAgent(req) {
  return req.headers['user-agent'] || '';
}

async function createAuditLog(options) {
  try {
    await AuditLog.create({
      tenantId: options.tenantId,
      userId: options.userId,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      oldValue: options.oldValue,
      newValue: options.newValue,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
}

function auditLog(action, resourceType, resourceIdExtractor) {
  return async (req, res, next) => {
    const originalSend = res.send.bind(res);

    res.send = function (body) {
      if (res.statusCode < 400 && req.user) {
        const resourceId = resourceIdExtractor
          ? resourceIdExtractor(req, res, body)
          : req.params.id || req.body.id;

        createAuditLog({
          tenantId: req.tenantId,
          userId: req.userId,
          action,
          resourceType,
          resourceId,
          oldValue: null,
          newValue: req.body,
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
      }

      return originalSend(body);
    };

    next();
  };
}

function auditLogWithChange(action, resourceType, getOldValue) {
  return async (req, res, next) => {
    if (res.locals.oldValue === undefined && getOldValue) {
      try {
        res.locals.oldValue = await getOldValue(req);
      } catch (error) {
        logger.error('Failed to get old value for audit:', error);
      }
    }

    const originalSend = res.send.bind(res);
    res.send = function (body) {
      if (res.statusCode < 400 && req.user) {
        createAuditLog({
          tenantId: req.tenantId,
          userId: req.userId,
          action,
          resourceType,
          resourceId: req.params.id,
          oldValue: res.locals.oldValue,
          newValue: req.body,
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
      }

      return originalSend(body);
    };

    next();
  };
}

module.exports = {
  getIpAddress,
  getUserAgent,
  createAuditLog,
  auditLog,
  auditLogWithChange,
};
