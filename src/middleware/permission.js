const logger = require('../../config/logger');

function requirePermission(...permissions) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: 'Authentication required',
          data: null,
        });
      }

      const userRoles = req.user.roles || [];
      const userPermissions = new Set();

      userRoles.forEach((role) => {
        if (role.permissions) {
          role.permissions.forEach((perm) => userPermissions.add(perm));
        }
      });

      if (userPermissions.has('*')) {
        return next();
      }

      const hasPermission = permissions.some((perm) => {
        if (userPermissions.has(perm)) {
          return true;
        }
        const [resource, action] = perm.split(':');
        if (userPermissions.has(`${resource}:*`)) {
          return true;
        }
        return false;
      });

      if (!hasPermission) {
        logger.warn(
          `Permission denied: User ${req.user.id} requires ${permissions.join(', ')}`
        );
        return res.status(403).json({
          code: 403,
          message: 'Insufficient permissions',
          data: null,
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        code: 500,
        message: 'Internal server error',
        data: null,
      });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: 'Authentication required',
          data: null,
        });
      }

      const userRoles = (req.user.roles || []).map((r) => r.code);
      const hasRole = roles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          code: 403,
          message: 'Role requirement not met',
          data: null,
        });
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(500).json({
        code: 500,
        message: 'Internal server error',
        data: null,
      });
    }
  };
}

module.exports = {
  requirePermission,
  requireRole,
};
