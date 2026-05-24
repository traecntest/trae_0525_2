const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rate-limiter');

const router = express.Router();

router.post('/login', authLimiter, validate(schemas.login), AuthController.login);
router.post('/register', validate(schemas.register), AuthController.register);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.post('/change-password', authenticate, AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);

module.exports = router;
