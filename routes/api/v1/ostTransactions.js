const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Expression */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.ostTransaction;

  Promise.resolve(routeHelper.perform(req, res, next, '/ostTransaction/Factory', 'r_a_v1_ot_1', null, null));
});

module.exports = router;
