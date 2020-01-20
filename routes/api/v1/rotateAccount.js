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
router.get('/twitter', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.rotateTwitterAccount;

  if (coreConstants.environment === 'production' || coreConstants.environment === 'sandbox') {
    // 404 error.
    const errorObject = responseHelper.error({
      internal_error_identifier: 'r_a_v1_ra_1',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    });

    return responseHelper.renderApiResponse(errorObject, res, errorConfig);
  }

  Promise.resolve(routeHelper.perform(req, res, next, '/rotate/Twitter', 'r_a_v1_ra_2', null));
});

/* Rotate google account. */
router.get('/google', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.rotateGoogleAccount;

  if (coreConstants.environment === 'production' || coreConstants.environment === 'sandbox') {
    // 404 error.
    const errorObject = responseHelper.error({
      internal_error_identifier: 'r_a_v1_ra_3',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    });

    return responseHelper.renderApiResponse(errorObject, res, errorConfig);
  }

  Promise.resolve(routeHelper.perform(req, res, next, '/rotate/Google', 'r_a_v1_ra_4', null));
});

/* Rotate apple account. */
router.get('/apple', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.rotateAppleAccount;

  if (coreConstants.environment === 'production' || coreConstants.environment === 'sandbox') {
    // 404 error.
    const errorObject = responseHelper.error({
      internal_error_identifier: 'r_a_v1_ra_5',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    });

    return responseHelper.renderApiResponse(errorObject, res, errorConfig);
  }

  Promise.resolve(routeHelper.perform(req, res, next, '/rotate/Apple', 'r_a_v1_ra_6', null));
});

/* Rotate github account. */
router.get('/github', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.rotateGithubAccount;

  if (coreConstants.environment === 'production' || coreConstants.environment === 'sandbox') {
    // 404 error.
    const errorObject = responseHelper.error({
      internal_error_identifier: 'r_a_v1_ra_7',
      api_error_identifier: 'resource_not_found',
      debug_options: {}
    });

    return responseHelper.renderApiResponse(errorObject, res, errorConfig);
  }

  Promise.resolve(routeHelper.perform(req, res, next, '/rotate/Github', 'r_a_v1_ra_8', null));
});

module.exports = router;
