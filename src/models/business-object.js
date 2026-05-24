const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class BusinessObject extends Model {}

BusinessObject.init(
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
    objectType: {
      type: DataTypes.ENUM(
        'PROJECT',
        'BUILDING',
        'INFRASTRUCTURE',
        'LAND',
        'ASSET',
        'FACILITY',
        'OTHER'
      ),
      allowNull: false,
      field: 'object_type',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
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
    address: {
      type: DataTypes.STRING(255),
    },
    area: {
      type: DataTypes.DECIMAL(14, 2),
    },
    floorArea: {
      type: DataTypes.DECIMAL(14, 2),
      field: 'floor_area',
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
    },
    floorsAbove: {
      type: DataTypes.INTEGER,
      field: 'floors_above',
    },
    floorsBelow: {
      type: DataTypes.INTEGER,
      field: 'floors_below',
    },
    yearBuilt: {
      type: DataTypes.INTEGER,
      field: 'year_built',
    },
    constructionType: {
      type: DataTypes.STRING(100),
      field: 'construction_type',
    },
    status: {
      type: DataTypes.ENUM(
        'PLANNING',
        'DESIGN',
        'CONSTRUCTION',
        'OPERATION',
        'MAINTENANCE',
        'DEMOLISHED'
      ),
      defaultValue: 'PLANNING',
    },
    startDate: {
      type: DataTypes.DATE,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      field: 'end_date',
    },
    relatedModelId: {
      type: DataTypes.STRING(36),
      field: 'related_model_id',
    },
    attributes: {
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
    modelName: 'BusinessObject',
    tableName: 'business_objects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['object_type'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = BusinessObject;
