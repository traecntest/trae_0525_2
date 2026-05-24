const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class SensorData extends Model {}

SensorData.init(
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
    deviceId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'device_id',
    },
    metricCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'metric_code',
    },
    metricName: {
      type: DataTypes.STRING(100),
      field: 'metric_name',
    },
    value: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
    },
    quality: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    receivedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'received_at',
    },
    metadata: {
      type: DataTypes.JSON,
    },
  },
  {
    sequelize,
    modelName: 'SensorData',
    tableName: 'sensor_data',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['device_id'] },
      { fields: ['device_id', 'metric_code'] },
      { fields: ['timestamp'] },
      { fields: ['device_id', 'timestamp'] },
    ],
  }
);

module.exports = SensorData;
