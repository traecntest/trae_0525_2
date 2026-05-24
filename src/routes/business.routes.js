const express = require('express');
const EventController = require('../controllers/event.controller');
const { BusinessController, SceneController, TaskController, TemporalController } = require('../controllers/business.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');
const { validate, validateQuery, validateParams, schemas } = require('../middleware/validator');

const router = express.Router();

router.use(authenticate);

router.get('/events', validateQuery(schemas.pagination), EventController.getEvents);
router.get('/events/stats', EventController.getEventStats);
router.get('/events/:id', validateParams(schemas.id), EventController.getEventById);
router.post('/events', requirePermission('event:write'), validate(schemas.event), EventController.createEvent);
router.put('/events/:id', requirePermission('event:write'), validateParams(schemas.id), EventController.updateEvent);
router.post('/events/:id/acknowledge', requirePermission('event:write'), validateParams(schemas.id), EventController.acknowledgeEvent);
router.post('/events/:id/resolve', requirePermission('event:write'), validateParams(schemas.id), EventController.resolveEvent);
router.post('/events/:id/assign', requirePermission('event:write'), validateParams(schemas.id), EventController.assignEvent);
router.delete('/events/:id', requirePermission('event:delete'), validateParams(schemas.id), EventController.deleteEvent);

router.get('/business', validateQuery(schemas.pagination), BusinessController.getObjects);
router.get('/business/stats', BusinessController.getStats);
router.get('/business/:id', validateParams(schemas.id), BusinessController.getObjectById);
router.post('/business', requirePermission('business:write'), validate(schemas.businessObject), BusinessController.createObject);
router.put('/business/:id', requirePermission('business:write'), validateParams(schemas.id), BusinessController.updateObject);
router.delete('/business/:id', requirePermission('business:delete'), validateParams(schemas.id), BusinessController.deleteObject);

router.get('/scenes', validateQuery(schemas.pagination), SceneController.getScenes);
router.get('/scenes/:id', validateParams(schemas.id), SceneController.getSceneById);
router.post('/scenes', requirePermission('scene:write'), validate(schemas.scene), SceneController.createScene);
router.put('/scenes/:id', requirePermission('scene:write'), validateParams(schemas.id), SceneController.updateScene);
router.delete('/scenes/:id', requirePermission('scene:delete'), validateParams(schemas.id), SceneController.deleteScene);
router.post('/scenes/:id/publish', requirePermission('scene:write'), validateParams(schemas.id), SceneController.publishScene);
router.post('/scenes/:id/models', requirePermission('scene:write'), validateParams(schemas.id), SceneController.addModels);
router.delete('/scenes/:id/models', requirePermission('scene:write'), validateParams(schemas.id), SceneController.removeModels);

router.get('/tasks', validateQuery(schemas.pagination), TaskController.getTasks);
router.get('/tasks/:id', validateParams(schemas.id), TaskController.getTaskById);
router.post('/tasks', requirePermission('task:write'), TaskController.createTask);
router.post('/tasks/:id/cancel', requirePermission('task:write'), validateParams(schemas.id), TaskController.cancelTask);
router.post('/tasks/:id/retry', requirePermission('task:write'), validateParams(schemas.id), TaskController.retryTask);

router.get('/temporal/:modelId', TemporalController.getTemporalStates);
router.get('/temporal/:modelId/at-time', TemporalController.getStateAtTime);
router.get('/temporal/:modelId/historical', TemporalController.getHistoricalTimeline);
router.post('/temporal', requirePermission('model:write'), TemporalController.createTemporalState);

module.exports = router;
