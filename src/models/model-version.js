const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class ModelVersion extends Model {}

ModelVersion.init(
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
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changelog: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING(500),
      field: 'file_path',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size',
    },
    boundingBox: {
      type: DataTypes.JSON,
      field: 'bounding_box',
    },
    centroid: {
      type: DataTypes.GEOMETRY('POINT'),
    },
    lodAssets: {
      type: DataTypes.JSON,
      field: 'lod_assets',
    },
    status: {
      type: DataTypes.ENUM('PROCESSING', 'READY', 'ERROR'),
      defaultValue: 'PROCESSING',
    },
    createdBy: {
      type: DataTypes.STRING(36),
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'ModelVersion',
    tableName: 'model_versions',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['model_id'] },
      { fields: ['tenant_id'] },
      { unique: true, fields: ['model_id', 'version'] },
    ],
  }
);

module.exports = ModelVersion;
