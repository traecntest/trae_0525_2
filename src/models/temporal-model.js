const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class TemporalModel extends Model {}

TemporalModel.init(
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
    modelId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'model_id',
    },
    timeType: {
      type: DataTypes.ENUM('HISTORICAL', 'REAL_TIME', 'PREDICTION', 'SIMULATION'),
      allowNull: false,
      field: 'time_type',
    },
    timeStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'time_start',
    },
    timeEnd: {
      type: DataTypes.DATE,
      field: 'time_end',
    },
    intervalUnit: {
      type: DataTypes.ENUM('SECOND', 'MINUTE', 'HOUR', 'DAY', 'MONTH', 'YEAR'),
      field: 'interval_unit',
    },
    intervalValue: {
      type: DataTypes.INTEGER,
      field: 'interval_value',
    },
    dataSource: {
      type: DataTypes.STRING(100),
      field: 'data_source',
    },
    snapshotPath: {
      type: DataTypes.STRING(500),
      field: 'snapshot_path',
    },
    attributeChanges: {
      type: DataTypes.JSON,
      field: 'attribute_changes',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'ARCHIVED'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    modelName: 'TemporalModel',
    tableName: 'temporal_models',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['model_id'] },
      { fields: ['time_start', 'time_end'] },
      { fields: ['time_type'] },
    ],
  }
);

module.exports = TemporalModel;
