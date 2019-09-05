const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch');

router.use('/prelaunch', preLaunchRoutes);

module.exports = router;
