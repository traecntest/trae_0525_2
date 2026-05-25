const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');
const bcrypt = require('bcryptjs');

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}

User.init(
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
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: function(value) {
          if (value && value !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Invalid email format');
            }
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(100),
      field: 'full_name',
    },
    avatar: {
      type: DataTypes.STRING(500),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '1=active, 0=disabled',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
    },
    lastLoginIp: {
      type: DataTypes.STRING(45),
      field: 'last_login_ip',
    },
    resetToken: {
      type: DataTypes.STRING(255),
      field: 'reset_token',
    },
    resetTokenExpiresAt: {
      type: DataTypes.DATE,
      field: 'reset_token_expires_at',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await User.hashPassword(user.password);
        }
      },
    },
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['status'] },
      { unique: true, fields: ['tenant_id', 'username'] },
      { unique: true, fields: ['tenant_id', 'email'] },
    ],
    defaultScope: {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiresAt'] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      },
    },
  }
);

module.exports = User;
