const config = require('./index');

module.exports = {
  development: {
    ...config.database,
  },
  test: {
    ...config.database,
    database: config.database.database + '_test',
  },
  production: {
    ...config.database,
    logging: false,
  },
};
