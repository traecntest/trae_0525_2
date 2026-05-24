const rateLimit = require('express-rate-limit');
const config = require('../../config/index');

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    code: 429,
    message: 'Too many requests, please try again later.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    code: 429,
    message: 'Too many authentication attempts, please try again later.',
    data: null,
  },
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    code: 429,
    message: 'API rate limit exceeded.',
    data: null,
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    code: 429,
    message: 'Upload rate limit exceeded.',
    data: null,
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
};
