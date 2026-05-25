const express = require('express');
const UserController = require('../controllers/user.controller');
const { authenticateJWT, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateJWT, requirePermission('user:list'), UserController.listUsers);
router.get('/roles', authenticateJWT, UserController.listRoles);
router.get('/:id', authenticateJWT, requirePermission('user:view'), UserController.getUser);
router.post('/', authenticateJWT, requirePermission('user:create'), UserController.createUser);
router.put('/:id', authenticateJWT, requirePermission('user:update'), UserController.updateUser);
router.delete('/:id', authenticateJWT, requirePermission('user:delete'), UserController.deleteUser);

module.exports = router;