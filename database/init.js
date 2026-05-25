const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/index');
const logger = require('../config/logger');

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    socketPath: process.env.DB_SOCKET_PATH || '/var/run/mysqld/mysqld.sock',
    multipleStatements: true,
  });

  try {
    logger.info('Creating database...');

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${config.database.database}\`
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci;
    `);

    logger.info(`Database ${config.database.database} created or already exists.`);

    await connection.changeUser({
      database: config.database.database,
    });

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Executing schema...');
    await connection.query(schemaSql);

    logger.info('Database schema initialized successfully.');
    logger.info(`Default admin user: admin / admin123`);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('Database initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
