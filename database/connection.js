const { Sequelize } = require('sequelize');
const config = require('../config/index');
const logger = require('../config/logger');

const sequelize = new Sequelize(
  config.database.database,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    dialectOptions: {
      socketPath: process.env.DB_SOCKET_PATH || '/var/run/mysqld/mysqld.sock',
    },
    timezone: config.database.timezone,
    pool: config.database.pool,
    logging: config.database.logging
      ? (msg) => logger.debug(`[DB] ${msg}`)
      : false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error.message);
    return false;
  }
}

async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force, alter: !force });
    logger.info('Database synchronized successfully.');
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', error.message);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
