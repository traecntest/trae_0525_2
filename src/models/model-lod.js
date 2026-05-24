const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class ModelLod extends Model {}

ModelLod.init(
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
    versionId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'version_id',
    },
    lodLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'lod_level',
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size',
    },
    triangleCount: {
      type: DataTypes.INTEGER,
      field: 'triangle_count',
    },
    vertexCount: {
      type: DataTypes.INTEGER,
      field: 'vertex_count',
    },
    screenError: {
      type: DataTypes.DECIMAL(10, 4),
      field: 'screen_error',
    },
  },
  {
    sequelize,
    modelName: 'ModelLod',
    tableName: 'model_lods',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['model_id'] },
      { fields: ['lod_level'] },
      { unique: true, fields: ['model_id', 'version_id', 'lod_level'] },
    ],
  }
);

module.exports = ModelLod;
