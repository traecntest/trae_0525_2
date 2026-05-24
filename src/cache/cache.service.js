const Redis = require('ioredis');
const config = require('../../config/index');
const logger = require('../../config/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.prefix = config.cache.prefix;
  }

  async connect() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        keyPrefix: this.prefix,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        logger.info('Redis cache connected');
      });

      this.client.on('error', (error) => {
        logger.error('Redis cache error:', error);
      });

      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.client) return null;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = config.cache.ttl) {
    try {
      if (!this.client) return false;
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.client) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async delByPattern(pattern) {
    try {
      if (!this.client) return false;
      const keys = await this.client.keys(`${this.prefix}${pattern}`);
      if (keys.length > 0) {
        const unprefixedKeys = keys.map((k) => k.replace(this.prefix, ''));
        await this.client.del(...unprefixedKeys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.client) return false;
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  getKey(...parts) {
    return parts.join(':');
  }

  close() {
    if (this.client) {
      this.client.quit();
    }
  }
}

const cacheService = new CacheService();

module.exports = cacheService;
