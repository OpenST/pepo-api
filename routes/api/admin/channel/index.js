const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

/* Create new channel. */
router.post('/user-data', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminCreateNewCommunity;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/channel/Create', 'r_a_ad_c_1', null, null, null));
});

module.exports = router;
