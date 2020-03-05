const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  redemptionsRoutes = require(rootPrefix + '/routes/storeApi/web/redemptions'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

router.use(cookieHelper.setWebCsrf());

router.use('/redemptions', redemptionsRoutes);

module.exports = router;
