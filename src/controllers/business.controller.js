const BusinessService = require('../services/business.service');
const SceneService = require('../services/scene.service');
const TaskService = require('../services/task.service');
const TemporalService = require('../services/temporal.service');

class BusinessController {
  async getObjects(req, res, next) {
    try {
      const result = await BusinessService.getObjects(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getObjectById(req, res, next) {
    try {
      const object = await BusinessService.getObjectById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data: object,
      });
    } catch (error) {
      next(error);
    }
  }

  async createObject(req, res, next) {
    try {
      const object = await BusinessService.createObject(
        req.tenantId,
        req.body,
        req.userId
      );

      res.status(201).json({
        code: 201,
        message: 'Business object created',
        data: object,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateObject(req, res, next) {
    try {
      const object = await BusinessService.updateObject(
        req.tenantId,
        req.params.id,
        req.body,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Business object updated',
        data: object,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteObject(req, res, next) {
    try {
      await BusinessService.deleteObject(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Business object deleted',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await BusinessService.getStats(req.tenantId);

      res.json({
        code: 200,
        message: 'Success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

class SceneController {
  async getScenes(req, res, next) {
    try {
      const result = await SceneService.getScenes(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSceneById(req, res, next) {
    try {
      const scene = await SceneService.getSceneById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data: scene,
      });
    } catch (error) {
      next(error);
    }
  }

  async createScene(req, res, next) {
    try {
      const scene = await SceneService.createScene(
        req.tenantId,
        req.body,
        req.userId
      );

      res.status(201).json({
        code: 201,
        message: 'Scene created',
        data: scene,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateScene(req, res, next) {
    try {
      const scene = await SceneService.updateScene(
        req.tenantId,
        req.params.id,
        req.body,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Scene updated',
        data: scene,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteScene(req, res, next) {
    try {
      await SceneService.deleteScene(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Scene deleted',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async publishScene(req, res, next) {
    try {
      const scene = await SceneService.publishScene(
        req.tenantId,
        req.params.id,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Scene published',
        data: scene,
      });
    } catch (error) {
      next(error);
    }
  }

  async addModels(req, res, next) {
    try {
      const scene = await SceneService.addModelsToScene(
        req.tenantId,
        req.params.id,
        req.body.modelIds,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Models added to scene',
        data: scene,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeModels(req, res, next) {
    try {
      const scene = await SceneService.removeModelsFromScene(
        req.tenantId,
        req.params.id,
        req.body.modelIds,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Models removed from scene',
        data: scene,
      });
    } catch (error) {
      next(error);
    }
  }
}

class TaskController {
  async getTasks(req, res, next) {
    try {
      const result = await TaskService.getTasks(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await TaskService.getTaskById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await TaskService.createTask(
        req.tenantId,
        req.body,
        req.userId
      );

      res.status(201).json({
        code: 201,
        message: 'Task created',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelTask(req, res, next) {
    try {
      const task = await TaskService.cancelTask(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Task cancelled',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async retryTask(req, res, next) {
    try {
      const task = await TaskService.retryTask(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Task retried',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
}

class TemporalController {
  async getTemporalStates(req, res, next) {
    try {
      const result = await TemporalService.getTemporalStates(
        req.tenantId,
        req.params.modelId,
        req.query
      );

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStateAtTime(req, res, next) {
    try {
      const state = await TemporalService.getStateAtTime(
        req.tenantId,
        req.params.modelId,
        req.query.timestamp
      );

      res.json({
        code: 200,
        message: 'Success',
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistoricalTimeline(req, res, next) {
    try {
      const timeline = await TemporalService.getHistoricalTimeline(
        req.tenantId,
        req.params.modelId,
        req.query.startTime,
        req.query.endTime
      );

      res.json({
        code: 200,
        message: 'Success',
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTemporalState(req, res, next) {
    try {
      const state = await TemporalService.createTemporalState(
        req.tenantId,
        req.body
      );

      res.status(201).json({
        code: 201,
        message: 'Temporal state created',
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  BusinessController: new BusinessController(),
  SceneController: new SceneController(),
  TaskController: new TaskController(),
  TemporalController: new TemporalController(),
};
