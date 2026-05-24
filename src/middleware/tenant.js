const config = require('../../config/index');
const { Tenant } = require('../models');
const logger = require('../../config/logger');

function extractTenantId(req) {
  if (!config.multitenant.enabled) {
    return config.multitenant.defaultTenantId;
  }

  const headerTenantId = req.headers['x-tenant-id'];
  if (headerTenantId) {
    return headerTenantId;
  }

  if (req.tenantId) {
    return req.tenantId;
  }

  return config.multitenant.defaultTenantId;
}

async function tenantMiddleware(req, res, next) {
  try {
    const tenantId = extractTenantId(req);

    if (config.multitenant.enabled) {
      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        return res.status(400).json({
          code: 400,
          message: 'Invalid tenant ID',
          data: null,
        });
      }

      if (tenant.status !== 1) {
        return res.status(403).json({
          code: 403,
          message: 'Tenant is inactive',
          data: null,
        });
      }

      if (tenant.expiresAt && new Date() > new Date(tenant.expiresAt)) {
        return res.status(403).json({
          code: 403,
          message: 'Tenant subscription expired',
          data: null,
        });
      }

      req.tenant = tenant;
    }

    req.tenantId = tenantId;

    next();
  } catch (error) {
    logger.error('Tenant middleware error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
    });
  }
}

function scopedToTenant(req, _res, next) {
  if (req.query && req.query.tenantId) {
    delete req.query.tenantId;
  }

  if (req.body && req.body.tenantId) {
    delete req.body.tenantId;
  }

  if (!req.tenantId) {
    req.tenantId = extractTenantId(req);
  }

  if (req.body) {
    req.body.tenantId = req.tenantId;
  }

  next();
}

module.exports = {
  extractTenantId,
  tenantMiddleware,
  scopedToTenant,
};
