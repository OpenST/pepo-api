const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.COOKIE_SECRET));

// Report.
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.reportIssue;

  Promise.resolve(routeHelper.perform(req, res, next, '/miscellaneous/Report', 'r_a_w_r_1', null, null));
});

module.exports = router;
