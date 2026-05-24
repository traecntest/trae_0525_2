const { Task } = require('../models');
const { generateId, buildPaginationResponse } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../middleware/error');
const cacheService = require('../cache/cache.service');
const taskQueue = require('../queue/task-queue');
const logger = require('../../config/logger');

class TaskService {
  async getTasks(tenantId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      taskType,
      status,
      priority,
    } = options;

    const where = { tenantId };
    if (taskType) where.taskType = taskType;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows } = await Task.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: (page - 1) * limit,
      limit,
    });

    return buildPaginationResponse(rows, count, page, limit);
  }

  async getTaskById(tenantId, taskId) {
    const task = await Task.findOne({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return task;
  }

  async createTask(tenantId, taskData, userId) {
    const task = await Task.create({
      id: generateId(),
      tenantId,
      createdBy: userId,
      status: 'QUEUED',
      ...taskData,
    });

    await this.queueTask(task);

    return task;
  }

  async updateTask(tenantId, taskId, updateData) {
    const task = await this.getTaskById(tenantId, taskId);

    if (updateData.status === 'PROCESSING') {
      updateData.startedAt = new Date();
    }

    if (updateData.status === 'COMPLETED' || updateData.status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    await task.update(updateData);

    return task;
  }

  async cancelTask(tenantId, taskId) {
    const task = await this.getTaskById(tenantId, taskId);

    if (task.status !== 'QUEUED' && task.status !== 'PROCESSING') {
      throw new BadRequestError('Task cannot be cancelled in current status');
    }

    await task.update({ status: 'CANCELLED' });

    return task;
  }

  async retryTask(tenantId, taskId) {
    const task = await this.getTaskById(tenantId, taskId);

    if (task.status !== 'FAILED') {
      throw new BadRequestError('Only failed tasks can be retried');
    }

    if (task.retryCount >= task.maxRetries) {
      throw new BadRequestError('Max retries exceeded');
    }

    const newTask = await Task.create({
      ...task.toJSON(),
      id: generateId(),
      status: 'QUEUED',
      progress: 0,
      retryCount: task.retryCount + 1,
      startedAt: null,
      completedAt: null,
      errorDetails: null,
    });

    await this.queueTask(newTask);

    return newTask;
  }

  async queueTask(task) {
    const queueMap = {
      MODEL_PROCESS: 'model_processing',
      MODEL_CONVERT: 'model_conversion',
      LOD_GENERATE: 'lod_generation',
      DATA_IMPORT: 'data_import',
      DATA_EXPORT: 'data_export',
      TILE_GENERATE: 'tile_generation',
      REPORT: 'report_generation',
      CLEANUP: 'cleanup',
    };

    const queueName = queueMap[task.taskType];

    if (queueName) {
      await taskQueue.addTask(
        queueName,
        {
          taskId: task.id,
          tenantId: task.tenantId,
          inputData: task.inputData,
        },
        {
          priority: task.priority,
        }
      );

      logger.info(`Task ${task.id} queued in ${queueName}`);
    }
  }

  async cleanupOldTasks(tenantId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Task.destroy({
      where: {
        tenantId,
        status: ['COMPLETED', 'CANCELLED'],
        createdAt: { [require('sequelize').Op.lt]: cutoffDate },
      },
    });

    logger.info(`Cleaned up ${result} old tasks`);
    return result;
  }
}

module.exports = new TaskService();
