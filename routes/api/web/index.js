const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch'),
  redemptionsRoutes = require(rootPrefix + '/routes/api/web/redemption');

router.use('/prelaunch', preLaunchRoutes);

router.use('/redemptions', redemptionsRoutes);

module.exports = router;
