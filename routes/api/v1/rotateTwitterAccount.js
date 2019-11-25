const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/* Rotate twitter account. */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.rotateTwitterAccount;

  if (coreConstants.environment === 'production' || coreConstants.environment === 'sandbox') {
    // 404 error.
    const errorObject = responseHelper.error({
      internal_error_identifier: 'r_a_v1_rta_1',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    });

    return responseHelper.renderApiResponse(errorObject, res, errorConfig);
  }

  Promise.resolve(routeHelper.perform(req, res, next, '/twitter/Rotate', 'r_a_v1_rta_2', null));
});

module.exports = router;
