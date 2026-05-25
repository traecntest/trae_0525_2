const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/index');
const logger = require('../config/logger');

async function initializeDatabase() {
  const connectionConfig = {
    user: config.database.user,
    password: config.database.password,
    multipleStatements: true,
    connectTimeout: 10000,
  };

  if (process.env.DB_SOCKET_PATH) {
    connectionConfig.socketPath = process.env.DB_SOCKET_PATH;
  } else {
    connectionConfig.host = config.database.host;
    connectionConfig.port = config.database.port;
  }

  let connection = await mysql.createConnection(connectionConfig);

  try {
    logger.info('Creating database...');

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${config.database.database}\`
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci;
    `);

    logger.info(`Database ${config.database.database} created or already exists.`);

    await connection.end();

    connectionConfig.database = config.database.database;
    connection = await mysql.createConnection(connectionConfig);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Executing schema...');

    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.query(statement);
        logger.debug(`Executed statement ${i + 1}/${statements.length}`);
      } catch (err) {
        logger.warn(`Warning on statement ${i + 1}: ${err.message}`);
      }
    }

    logger.info('Database schema initialized successfully.');
    logger.info(`Default admin user: admin / admin123`);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // ignore
      }
    }
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
