const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch'),
  redemptionsRoutes = require(rootPrefix + '/routes/api/web/redemptions'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support');

router.use('/prelaunch', preLaunchRoutes);

router.use('/redemptions', redemptionsRoutes);

router.use('/support', supportRoutes);

module.exports = router;
