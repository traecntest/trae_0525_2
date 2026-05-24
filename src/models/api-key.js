const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class ApiKey extends Model {}

ApiKey.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'tenant_id',
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'user_id',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'api_key',
    },
    scopes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rateLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      field: 'rate_limit',
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      field: 'last_used_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at',
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: 'ApiKey',
    tableName: 'api_keys',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['api_key'] },
    ],
  }
);

module.exports = ApiKey;
