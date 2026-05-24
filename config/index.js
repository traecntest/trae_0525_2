const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'digital_twin_cim',
    dialect: 'mysql',
    timezone: '+08:00',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 60000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.CACHE_PREFIX || 'digital_twin:',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key_for_development_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 524288000,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(','),
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
    prefix: process.env.CACHE_PREFIX || 'digital_twin:',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || '*').split(','),
    credentials: true,
  },

  websocket: {
    enabled: process.env.WS_ENABLED === 'true',
    port: parseInt(process.env.WS_PORT, 10) || 3001,
  },

  multitenant: {
    enabled: process.env.MULTI_TENANT_ENABLED === 'true',
    defaultTenantId: process.env.DEFAULT_TENANT_ID || 'default',
  },
};
