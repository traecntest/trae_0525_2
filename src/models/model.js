const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class Model3D extends Model {}

Model3D.init(
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
    categoryId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'category_id',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    modelType: {
      type: DataTypes.ENUM('BIM', 'GIS', 'POINTCLOUD', 'OBLIQUE', '3DMODEL', 'OTHER'),
      defaultValue: '3DMODEL',
      field: 'model_type',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING(500),
      field: 'file_path',
    },
    fileName: {
      type: DataTypes.STRING(255),
      field: 'file_name',
    },
    fileSize: {
      type: DataTypes.BIGINT,
      field: 'file_size',
    },
    fileFormat: {
      type: DataTypes.STRING(20),
      field: 'file_format',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    totalVersions: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'total_versions',
    },
    srid: {
      type: DataTypes.INTEGER,
      defaultValue: 4326,
    },
    boundingBox: {
      type: DataTypes.JSON,
      field: 'bounding_box',
    },
    centroid: {
      type: DataTypes.GEOMETRY('POINT'),
    },
    elevation: {
      type: DataTypes.DECIMAL(12, 3),
    },
    rotation: {
      type: DataTypes.JSON,
    },
    scale: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.0,
    },
    lodLevels: {
      type: DataTypes.JSON,
      field: 'lod_levels',
    },
    tags: {
      type: DataTypes.JSON,
    },
    metadata: {
      type: DataTypes.JSON,
    },
    status: {
      type: DataTypes.ENUM('UPLOADING', 'PROCESSING', 'READY', 'ERROR', 'ARCHIVED'),
      defaultValue: 'UPLOADING',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message',
    },
    processingProgress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'processing_progress',
    },
    isPublished: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      field: 'is_published',
    },
    publishedAt: {
      type: DataTypes.DATE,
      field: 'published_at',
    },
    createdBy: {
      type: DataTypes.STRING(36),
      field: 'created_by',
    },
    updatedBy: {
      type: DataTypes.STRING(36),
      field: 'updated_by',
    },
  },
  {
    sequelize,
    modelName: 'Model3D',
    tableName: 'models',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['category_id'] },
      { fields: ['model_type'] },
      { fields: ['status'] },
      { fields: ['is_published'] },
    ],
  }
);

module.exports = Model3D;
