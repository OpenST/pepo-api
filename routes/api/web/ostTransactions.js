const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

/* OST Transaction. */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.ostTransaction;

  Promise.resolve(routeHelper.perform(req, res, next, '/ostTransaction/Factory', 'r_a_w_ot_1', null, null));
});

module.exports = router;
