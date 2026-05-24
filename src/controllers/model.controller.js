const ModelService = require('../services/model.service');

class ModelController {
  async getModels(req, res, next) {
    try {
      const result = await ModelService.getModels(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModelById(req, res, next) {
    try {
      const model = await ModelService.getModelById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async createModel(req, res, next) {
    try {
      const model = await ModelService.createModel(
        req.tenantId,
        req.userId,
        req.body,
        req.file
      );

      res.status(201).json({
        code: 201,
        message: 'Model created successfully',
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateModel(req, res, next) {
    try {
      const model = await ModelService.updateModel(
        req.tenantId,
        req.params.id,
        req.body,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Model updated successfully',
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteModel(req, res, next) {
    try {
      await ModelService.deleteModel(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Model deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadVersion(req, res, next) {
    try {
      const version = await ModelService.uploadModelVersion(
        req.tenantId,
        req.params.id,
        req.file,
        req.userId,
        req.body.changelog
      );

      res.status(201).json({
        code: 201,
        message: 'Version uploaded successfully',
        data: version,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req, res, next) {
    try {
      const versions = await ModelService.getModelVersions(
        req.tenantId,
        req.params.id
      );

      res.json({
        code: 200,
        message: 'Success',
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModelLods(req, res, next) {
    try {
      const lods = await ModelService.getModelLods(
        req.tenantId,
        req.params.id,
        req.query.versionId
      );

      res.json({
        code: 200,
        message: 'Success',
        data: lods,
      });
    } catch (error) {
      next(error);
    }
  }

  async publishModel(req, res, next) {
    try {
      const model = await ModelService.publishModel(
        req.tenantId,
        req.params.id,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Model published successfully',
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async unpublishModel(req, res, next) {
    try {
      const model = await ModelService.unpublishModel(
        req.tenantId,
        req.params.id,
        req.userId
      );

      res.json({
        code: 200,
        message: 'Model unpublished successfully',
        data: model,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await ModelService.getCategories(
        req.tenantId,
        req.query.parentId
      );

      res.json({
        code: 200,
        message: 'Success',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await ModelService.createCategory(
        req.tenantId,
        req.body
      );

      res.status(201).json({
        code: 201,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ModelController();
