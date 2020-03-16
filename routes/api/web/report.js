const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

// Report.
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.reportIssue;

  Promise.resolve(routeHelper.perform(req, res, next, '/miscellaneous/Report', 'r_a_w_r_1', null, null));
});

module.exports = router;
