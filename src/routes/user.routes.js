const express = require('express');
const UserController = require('../controllers/user.controller');
const { authenticateJWT, requirePermission } = require('../middleware/auth');
const { validate, validateParams, schemas } = require('../middleware/validator');

const router = express.Router();

router.get('/', authenticateJWT, requirePermission('user:list'), validate(schemas.pagination, 'query'), UserController.listUsers);
router.get('/roles', authenticateJWT, UserController.listRoles);
router.get('/:id', authenticateJWT, requirePermission('user:view'), validateParams(schemas.id), UserController.getUser);
router.post('/', authenticateJWT, requirePermission('user:create'), validate(schemas.userCreate), UserController.createUser);
router.put('/:id', authenticateJWT, requirePermission('user:update'), validateParams(schemas.id), validate(schemas.userUpdate), UserController.updateUser);
router.delete('/:id', authenticateJWT, requirePermission('user:delete'), validateParams(schemas.id), UserController.deleteUser);

module.exports = router;