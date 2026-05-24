const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'tenant_id',
    },
    userId: {
      type: DataTypes.STRING(36),
      field: 'user_id',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resourceType: {
      type: DataTypes.STRING(50),
      field: 'resource_type',
    },
    resourceId: {
      type: DataTypes.STRING(36),
      field: 'resource_id',
    },
    oldValue: {
      type: DataTypes.JSON,
      field: 'old_value',
    },
    newValue: {
      type: DataTypes.JSON,
      field: 'new_value',
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      field: 'user_agent',
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['resource_type', 'resource_id'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = AuditLog;
