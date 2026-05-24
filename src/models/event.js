const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class Event extends Model {}

Event.init(
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
    eventType: {
      type: DataTypes.ENUM('ALERT', 'INCIDENT', 'MAINTENANCE', 'OPERATION', 'OTHER'),
      allowNull: false,
      field: 'event_type',
    },
    severity: {
      type: DataTypes.ENUM('INFO', 'WARNING', 'MINOR', 'MAJOR', 'CRITICAL'),
      defaultValue: 'INFO',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    location: {
      type: DataTypes.GEOMETRY('POINT'),
    },
    srid: {
      type: DataTypes.INTEGER,
      defaultValue: 4326,
    },
    relatedModelId: {
      type: DataTypes.STRING(36),
      field: 'related_model_id',
    },
    relatedDeviceId: {
      type: DataTypes.STRING(36),
      field: 'related_device_id',
    },
    status: {
      type: DataTypes.ENUM('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
      defaultValue: 'NEW',
    },
    eventTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'event_time',
    },
    acknowledgedAt: {
      type: DataTypes.DATE,
      field: 'acknowledged_at',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at',
    },
    assignedTo: {
      type: DataTypes.STRING(36),
      field: 'assigned_to',
    },
    createdBy: {
      type: DataTypes.STRING(36),
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['event_type'] },
      { fields: ['severity'] },
      { fields: ['status'] },
      { fields: ['event_time'] },
    ],
  }
);

module.exports = Event;
