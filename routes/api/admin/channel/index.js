const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

/* Edit channel. */
router.post('/edit-channel', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminEditChannel;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/channel/Edit', 'r_a_ad_c_1', null, null, null));
});

module.exports = router;
