const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class ModelScene extends Model {}

ModelScene.init(
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
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modelIds: {
      type: DataTypes.JSON,
      field: 'model_ids',
    },
    initialView: {
      type: DataTypes.JSON,
      field: 'initial_view',
    },
    environmentMap: {
      type: DataTypes.STRING(500),
      field: 'environment_map',
    },
    backgroundColor: {
      type: DataTypes.STRING(20),
      defaultValue: '#87CEEB',
      field: 'background_color',
    },
    ambientIntensity: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.5,
      field: 'ambient_intensity',
    },
    sunDirection: {
      type: DataTypes.JSON,
      field: 'sun_direction',
    },
    tags: {
      type: DataTypes.JSON,
    },
    metadata: {
      type: DataTypes.JSON,
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
      defaultValue: 'DRAFT',
    },
    createdBy: {
      type: DataTypes.STRING(36),
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'ModelScene',
    tableName: 'model_scenes',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = ModelScene;
