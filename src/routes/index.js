const express = require('express');
const authRoutes = require('./auth.routes');
const modelRoutes = require('./model.routes');
const iotRoutes = require('./iot.routes');
const spatialRoutes = require('./spatial.routes');
const businessRoutes = require('./business.routes');
const userRoutes = require('./user.routes');
const { authenticateJWT, authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/models', authenticateJWT, modelRoutes);
router.use('/iot', authenticateJWT, iotRoutes);
router.use('/spatial', authenticateJWT, spatialRoutes);
router.use('/business', authenticateJWT, businessRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
