const winston = require('winston');
const path = require('path');
const config = require('./index');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    ),
  }),
];

if (config.nodeEnv !== 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
      maxsize: '20m',
      maxFiles: config.logging.maxFiles,
    })
  );
  transports.push(
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
      maxsize: '20m',
      maxFiles: config.logging.maxFiles,
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(config.logging.dir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(config.logging.dir, 'rejections.log') }),
  ],
});

module.exports = logger;
