const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class SpatialData extends Model {}

SpatialData.init(
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
    },
    dataType: {
      type: DataTypes.ENUM(
        'POINT',
        'LINESTRING',
        'POLYGON',
        'MULTIPOINT',
        'MULTILINESTRING',
        'MULTIPOLYGON',
        'GEOMETRYCOLLECTION'
      ),
      allowNull: false,
      field: 'data_type',
    },
    source: {
      type: DataTypes.ENUM('GIS', 'BIM', 'IOT', 'MANUAL', 'IMPORT'),
      defaultValue: 'MANUAL',
    },
    geometry: {
      type: DataTypes.GEOMETRY,
      allowNull: false,
    },
    srid: {
      type: DataTypes.INTEGER,
      defaultValue: 4326,
    },
    attributes: {
      type: DataTypes.JSON,
    },
    layer: {
      type: DataTypes.STRING(100),
    },
    elevation: {
      type: DataTypes.DECIMAL(12, 3),
    },
    height: {
      type: DataTypes.DECIMAL(12, 3),
    },
    style: {
      type: DataTypes.JSON,
    },
    tags: {
      type: DataTypes.JSON,
    },
    metadata: {
      type: DataTypes.JSON,
    },
    createdBy: {
      type: DataTypes.STRING(36),
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'SpatialData',
    tableName: 'spatial_data',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['data_type'] },
      { fields: ['layer'] },
    ],
  }
);

module.exports = SpatialData;
