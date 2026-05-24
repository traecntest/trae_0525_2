const express = require('express');
const authRoutes = require('./auth.routes');
const modelRoutes = require('./model.routes');
const iotRoutes = require('./iot.routes');
const spatialRoutes = require('./spatial.routes');
const businessRoutes = require('./business.routes');
const { authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/models', authenticateApiKey, modelRoutes);
router.use('/iot', authenticateApiKey, iotRoutes);
router.use('/spatial', authenticateApiKey, spatialRoutes);
router.use('/', authenticateApiKey, businessRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
