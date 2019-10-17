const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  preLaunchRoutes = require(rootPrefix + '/routes/api/web/preLaunch'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

//NOTE: CSRF COOKIE SHOULD NOT BE SET HERE. IT SHOULD ONLY BE SET AT WEB. DO NOT UNCOMMENT-AMAN
// router.use(cookieHelper.setWebCsrf());

router.use('/prelaunch', preLaunchRoutes);

router.use('/support', supportRoutes);

module.exports = router;
