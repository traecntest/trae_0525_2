const express = require('express');
const SpatialController = require('../controllers/spatial.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validate, validateQuery, validateParams, schemas } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(schemas.pagination), SpatialController.getSpatialData);
router.get('/:id', validateParams(schemas.id), SpatialController.getSpatialDataById);
router.post('/', requirePermission('spatial:write'), validate(schemas.spatialData), SpatialController.createSpatialData);
router.post('/batch', requirePermission('spatial:write'), SpatialController.batchCreateSpatialData);
router.put('/:id', requirePermission('spatial:write'), validateParams(schemas.id), SpatialController.updateSpatialData);
router.delete('/:id', requirePermission('spatial:delete'), validateParams(schemas.id), SpatialController.deleteSpatialData);
router.post('/query', SpatialController.queryByGeometry);

router.get('/layers/list', SpatialController.getMapLayers);
router.post('/layers', requirePermission('spatial:write'), SpatialController.createMapLayer);
router.put('/layers/:id', requirePermission('spatial:write'), validateParams(schemas.id), SpatialController.updateMapLayer);
router.delete('/layers/:id', requirePermission('spatial:delete'), validateParams(schemas.id), SpatialController.deleteMapLayer);

module.exports = router;
