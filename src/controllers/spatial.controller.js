const SpatialService = require('../services/spatial.service');

class SpatialController {
  async getSpatialData(req, res, next) {
    try {
      const result = await SpatialService.getSpatialData(req.tenantId, req.query);

      res.json({
        code: 200,
        message: 'Success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSpatialDataById(req, res, next) {
    try {
      const data = await SpatialService.getSpatialDataById(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSpatialData(req, res, next) {
    try {
      const data = await SpatialService.createSpatialData(req.tenantId, req.body);

      res.status(201).json({
        code: 201,
        message: 'Spatial data created',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async batchCreateSpatialData(req, res, next) {
    try {
      const data = await SpatialService.batchCreateSpatialData(
        req.tenantId,
        req.body.features,
        req.body.source
      );

      res.status(201).json({
        code: 201,
        message: 'Spatial data batch created',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSpatialData(req, res, next) {
    try {
      const data = await SpatialService.updateSpatialData(
        req.tenantId,
        req.params.id,
        req.body
      );

      res.json({
        code: 200,
        message: 'Spatial data updated',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSpatialData(req, res, next) {
    try {
      await SpatialService.deleteSpatialData(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Spatial data deleted',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async queryByGeometry(req, res, next) {
    try {
      const result = await SpatialService.queryByGeometry(
        req.tenantId,
        req.body.geometry,
        req.body.options
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

  async getMapLayers(req, res, next) {
    try {
      const layers = await SpatialService.getMapLayers(req.tenantId);

      res.json({
        code: 200,
        message: 'Success',
        data: layers,
      });
    } catch (error) {
      next(error);
    }
  }

  async createMapLayer(req, res, next) {
    try {
      const layer = await SpatialService.createMapLayer(req.tenantId, req.body);

      res.status(201).json({
        code: 201,
        message: 'Map layer created',
        data: layer,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMapLayer(req, res, next) {
    try {
      const layer = await SpatialService.updateMapLayer(
        req.tenantId,
        req.params.id,
        req.body
      );

      res.json({
        code: 200,
        message: 'Map layer updated',
        data: layer,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMapLayer(req, res, next) {
    try {
      await SpatialService.deleteMapLayer(req.tenantId, req.params.id);

      res.json({
        code: 200,
        message: 'Map layer deleted',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SpatialController();
