const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class MapLayer extends Model {}

MapLayer.init(
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
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    layerType: {
      type: DataTypes.ENUM('VECTOR', 'RASTER', '3D_TILES', 'GEOJSON', 'WMS', 'WMTS'),
      allowNull: false,
      field: 'layer_type',
    },
    url: {
      type: DataTypes.STRING(500),
    },
    format: {
      type: DataTypes.STRING(20),
    },
    minZoom: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'min_zoom',
    },
    maxZoom: {
      type: DataTypes.INTEGER,
      defaultValue: 22,
      field: 'max_zoom',
    },
    bounds: {
      type: DataTypes.JSON,
    },
    style: {
      type: DataTypes.JSON,
    },
    visible: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
    opacity: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.0,
    },
    metadata: {
      type: DataTypes.JSON,
    },
  },
  {
    sequelize,
    modelName: 'MapLayer',
    tableName: 'map_layers',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['layer_type'] },
    ],
  }
);

module.exports = MapLayer;
