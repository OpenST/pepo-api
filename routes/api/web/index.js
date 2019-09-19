const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch'),
  redemptionsRoutes = require(rootPrefix + '/routes/api/web/redemptions'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));
router.use(cookieHelper.setWebCsrf());

router.use('/prelaunch', preLaunchRoutes);

router.use('/redemptions', redemptionsRoutes);

module.exports = router;
