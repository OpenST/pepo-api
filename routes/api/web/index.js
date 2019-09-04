const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch');

router.use('/preLaunch', preLaunchRoutes);

module.exports = router;
