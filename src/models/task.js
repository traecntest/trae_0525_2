const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../database/connection');

class Task extends Model {}

Task.init(
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
    taskType: {
      type: DataTypes.ENUM(
        'MODEL_PROCESS',
        'MODEL_CONVERT',
        'LOD_GENERATE',
        'DATA_IMPORT',
        'DATA_EXPORT',
        'TILE_GENERATE',
        'REPORT',
        'CLEANUP'
      ),
      allowNull: false,
      field: 'task_type',
    },
    priority: {
      type: DataTypes.TINYINT,
      defaultValue: 5,
    },
    status: {
      type: DataTypes.ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      defaultValue: 'QUEUED',
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    message: {
      type: DataTypes.TEXT,
    },
    inputData: {
      type: DataTypes.JSON,
      field: 'input_data',
    },
    outputData: {
      type: DataTypes.JSON,
      field: 'output_data',
    },
    errorDetails: {
      type: DataTypes.JSON,
      field: 'error_details',
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'retry_count',
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      field: 'max_retries',
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at',
    },
    createdBy: {
      type: DataTypes.STRING(36),
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['task_type'] },
      { fields: ['status'] },
      { fields: ['priority'] },
    ],
  }
);

module.exports = Task;
