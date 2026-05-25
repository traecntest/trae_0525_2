const jwt = require('jsonwebtoken');
const config = require('../../config/index');
const { User } = require('../models');
const logger = require('../../config/logger');
const { UnauthorizedError, ForbiddenError } = require('./error');

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      username: user.username,
      email: user.email,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    return null;
  }
}

async function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ association: 'roles' }],
    });

    if (!user || user.status !== 1) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = user;
    req.tenantId = user.tenantId;
    req.userId = user.id;
    req.userRoles = user.roles?.map((r) => r.code) || [];

    next();
  } catch (error) {
    next(error);
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (req.userRoles?.includes('admin')) {
      return next();
    }

    const userPermissions = req.user.roles?.flatMap((r) => r.permissions || []) || [];
    if (!userPermissions.includes(permission)) {
      return next(new ForbiddenError(`Permission denied: ${permission}`));
    }

    next();
  };
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: 'No token provided',
        data: null,
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        code: 401,
        message: 'Invalid or expired token',
        data: null,
      });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{ association: 'roles' }],
    });

    if (!user || user.status !== 1) {
      return res.status(401).json({
        code: 401,
        message: 'User not found or inactive',
        data: null,
      });
    }

    req.user = user;
    req.tenantId = user.tenantId;
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Internal server error',
      data: null,
    });
  }
}

async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return next();
    }

    const { ApiKey } = require('../models');
    const keyRecord = await ApiKey.findOne({
      where: { apiKey: apiKey, status: 1 },
      include: [{ association: 'user' }],
    });

    if (!keyRecord) {
      return res.status(401).json({
        code: 401,
        message: 'Invalid API key',
        data: null,
      });
    }

    if (keyRecord.expiresAt && new Date() > new Date(keyRecord.expiresAt)) {
      return res.status(401).json({
        code: 401,
        message: 'API key expired',
        data: null,
      });
    }

    await keyRecord.update({ lastUsedAt: new Date() });

    if (keyRecord.user) {
      req.user = keyRecord.user;
      req.tenantId = keyRecord.user.tenantId;
      req.userId = keyRecord.user.id;
      req.apiScopes = keyRecord.scopes;
    }

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    next();
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticateJWT(req, res, next);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticate,
  authenticateJWT,
  authenticateApiKey,
  requirePermission,
  optionalAuth,
};
