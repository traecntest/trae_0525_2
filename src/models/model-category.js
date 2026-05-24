const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class ModelCategory extends Model {}

ModelCategory.init(
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
    parentId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'parent_id',
    },
    name: {
      type: DataTypes.STRING(100),
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
    icon: {
      type: DataTypes.STRING(500),
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
  },
  {
    sequelize,
    modelName: 'ModelCategory',
    tableName: 'model_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['parent_id'] },
      { fields: ['model_type'] },
    ],
  }
);

module.exports = ModelCategory;
