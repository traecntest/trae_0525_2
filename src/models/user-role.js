const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class UserRole extends Model {}

UserRole.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'user_id',
    },
    roleId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'role_id',
    },
    tenantId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'tenant_id',
    },
    assignedAt: {
      type: DataTypes.DATE,
      field: 'assigned_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['user_id', 'role_id'] },
      { fields: ['user_id'] },
      { fields: ['role_id'] },
    ],
  }
);

module.exports = UserRole;
