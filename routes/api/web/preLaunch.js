const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

// TODO - login - move double-opt-in route out of
/* Double opt in email*/
router.get('/double-opt-in', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.doubleOptIn;

  Promise.resolve(routeHelper.perform(req, res, next, '/VerifyDoubleOptIn', 'r_a_w_pl_5', null));
});

module.exports = router;
