const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class IotDevice extends Model {}

IotDevice.init(
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
    deviceCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'device_code',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    deviceType: {
      type: DataTypes.ENUM(
        'CAMERA',
        'SENSOR',
        'ACTUATOR',
        'GATEWAY',
        'CONTROLLER',
        'OTHER'
      ),
      allowNull: false,
      field: 'device_type',
    },
    manufacturer: {
      type: DataTypes.STRING(100),
    },
    model: {
      type: DataTypes.STRING(100),
    },
    protocol: {
      type: DataTypes.ENUM('MQTT', 'HTTP', 'MODBUS', 'COAP', 'ZIGBEE', 'OTHER'),
      defaultValue: 'MQTT',
    },
    status: {
      type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'FAULT', 'MAINTENANCE'),
      defaultValue: 'OFFLINE',
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
    },
    srid: {
      type: DataTypes.INTEGER,
      defaultValue: 4326,
    },
    address: {
      type: DataTypes.STRING(255),
    },
    installationDate: {
      type: DataTypes.DATE,
      field: 'installation_date',
    },
    lastHeartbeat: {
      type: DataTypes.DATE,
      field: 'last_heartbeat',
    },
    firmwareVersion: {
      type: DataTypes.STRING(50),
      field: 'firmware_version',
    },
    config: {
      type: DataTypes.JSON,
    },
    capabilities: {
      type: DataTypes.JSON,
    },
    tags: {
      type: DataTypes.JSON,
    },
    metadata: {
      type: DataTypes.JSON,
    },
  },
  {
    sequelize,
    modelName: 'IotDevice',
    tableName: 'iot_devices',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['device_type'] },
      { fields: ['status'] },
      { unique: true, fields: ['tenant_id', 'device_code'] },
    ],
  }
);

module.exports = IotDevice;
