const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const config = require('../config/index');
const logger = require('../config/logger');
const { sequelize, testConnection, syncDatabase } = require('../database/connection');
const { setupAssociations } = require('./models');
const cacheService = require('./cache/cache.service');
const taskQueue = require('./queue/task-queue');
const DataProcessingService = require('./services/data-processing.service');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { tenantMiddleware } = require('./middleware/tenant');
const { globalLimiter } = require('./middleware/rate-limiter');

const routes = require('./routes');

class Application {
  constructor() {
    this.app = express();
    this.server = null;
    this.wsServer = null;
  }

  async initialize() {
    logger.info('Initializing Digital Twin CIM Platform...');

    this.setupDirectories();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();

    await this.connectDatabase();
    await this.connectCache();
    this.setupTaskProcessors();
    this.setupCronJobs();

    if (config.websocket.enabled) {
      this.setupWebSocket();
    }
  }

  setupDirectories() {
    const dirs = [config.upload.dir, config.logging.dir];
    dirs.forEach((dir) => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info(`Created directory: ${fullPath}`);
      }
    });
  }

  setupMiddleware() {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }));

    this.app.use(compression());

    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    }));

    this.app.use(express.json({
      limit: '50mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    }));

    this.app.use(express.urlencoded({
      extended: true,
      limit: '50mb',
    }));

    this.app.use(globalLimiter);

    this.app.use(tenantMiddleware);

    this.app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)));
  }

  setupRoutes() {
    this.app.use('/api/v1', routes);

    this.app.use(express.static(path.join(process.cwd(), 'frontend')));

    this.app.get('/', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
    });

    this.app.get(/^\/(?!api\/|uploads\/|assets\/).*/, (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
    });
  }

  setupErrorHandling() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  async connectDatabase() {
    logger.info('Connecting to database...');
    const connected = await testConnection();

    if (connected) {
      setupAssociations();
      await syncDatabase(false);
      logger.info('Database connected and synchronized successfully');
    } else {
      logger.error('Failed to connect to database');
      throw new Error('Database connection failed');
    }
  }

  async connectCache() {
    logger.info('Connecting to Redis cache...');
    const connected = await cacheService.connect();

    if (connected) {
      logger.info('Redis cache connected successfully');
    } else {
      logger.warn('Redis cache connection failed, running without cache');
    }
  }

  setupTaskProcessors() {
    taskQueue.processQueue('model_processing', async (data) => {
      logger.info('Processing model task:', data);
      await DataProcessingService.processModelFile(data);
    }, 2);

    taskQueue.processQueue('data_import', async (data) => {
      logger.info('Processing data import task:', data);
      await DataProcessingService.processDataImport(data);
    }, 1);

    logger.info('Task processors initialized');
  }

  setupCronJobs() {
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running daily cleanup job...');
      try {
        await DataProcessingService.cleanupExpiredFiles();
        await cacheService.flush();
        logger.info('Daily cleanup completed');
      } catch (error) {
        logger.error('Daily cleanup failed:', error);
      }
    });

    cron.schedule('*/5 * * * *', async () => {
      logger.debug('Running health check...');
    });

    logger.info('Cron jobs initialized');
  }

  setupWebSocket() {
    const http = require('http');
    const { Server } = require('socket.io');

    this.server = http.createServer(this.app);

    this.wsServer = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
    });

    this.wsServer.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join', (data) => {
        socket.join(data.room);
        logger.info(`Client ${socket.id} joined room: ${data.room}`);
      });

      socket.on('leave', (data) => {
        socket.leave(data.room);
        logger.info(`Client ${socket.id} left room: ${data.room}`);
      });

      socket.on('model-update', (data) => {
        socket.to(data.room).emit('model-updated', data);
      });

      socket.on('event-new', (data) => {
        socket.to(data.room).emit('event-created', data);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    logger.info('WebSocket server initialized');
  }

  async start() {
    await this.initialize();

    const port = config.port;
    const host = config.host;

    if (this.server) {
      this.server.listen(port, host, () => {
        logger.info(`Server running on http://${host}:${port}`);
        logger.info(`WebSocket running on ws://${host}:${port}`);
      });
    } else {
      this.app.listen(port, host, () => {
        logger.info(`Server running on http://${host}:${port}`);
      });
    }

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });
  }

  async shutdown() {
    logger.info('Shutting down application...');

    try {
      await sequelize.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }

    try {
      cacheService.close();
      logger.info('Cache connection closed');
    } catch (error) {
      logger.error('Error closing cache connection:', error);
    }

    try {
      await taskQueue.closeAll();
      logger.info('Task queues closed');
    } catch (error) {
      logger.error('Error closing task queues:', error);
    }

    if (this.server) {
      this.server.close();
    }

    logger.info('Application shutdown complete');
  }
}

const application = new Application();

if (require.main === module) {
  application.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = application;
