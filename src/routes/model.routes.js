const express = require('express');
const ModelController = require('../controllers/model.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validate, validateQuery, validateParams, schemas } = require('../middleware/validator');
const { modelUpload, handleUploadError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rate-limiter');

const router = express.Router();

router.use(authenticate);

router.get('/', validateQuery(schemas.pagination), ModelController.getModels);
router.get('/categories', ModelController.getCategories);
router.post('/categories', requirePermission('model:write'), ModelController.createCategory);
router.get('/:id', validateParams(schemas.id), ModelController.getModelById);
router.post('/', requirePermission('model:write'), uploadLimiter, modelUpload.single('file'), handleUploadError, ModelController.createModel);
router.put('/:id', requirePermission('model:write'), validateParams(schemas.id), ModelController.updateModel);
router.delete('/:id', requirePermission('model:delete'), validateParams(schemas.id), ModelController.deleteModel);
router.post('/:id/versions', requirePermission('model:write'), validateParams(schemas.id), uploadLimiter, modelUpload.single('file'), handleUploadError, ModelController.uploadVersion);
router.get('/:id/versions', validateParams(schemas.id), ModelController.getVersions);
router.get('/:id/lods', validateParams(schemas.id), ModelController.getModelLods);
router.post('/:id/publish', requirePermission('model:publish'), validateParams(schemas.id), ModelController.publishModel);
router.post('/:id/unpublish', requirePermission('model:publish'), validateParams(schemas.id), ModelController.unpublishModel);

module.exports = router;
