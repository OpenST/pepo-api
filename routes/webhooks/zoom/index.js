const express = require('express');

const rootPrefix = '../../..',
  ZoomEventCreateService = require(rootPrefix + '/app/services/zoomEvents/Create'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

const router = express.Router();

const validateZoomSignature = async function(req, res, next) {
  if (
    coreConstants.PEPO_ZOOM_WEBHOOK_VERIFICATION_TOKEN !== req.headers['authorization'] ||
    coreConstants.PEPO_ZOOM_ACCOUNT_ID !== req.body.payload.account_id
  ) {
    const errorObj = responseHelper.error({
      internal_error_identifier: 'r_w_z_i_vzs_1',
      api_error_identifier: 'unauthorized_api_request',
      debug_options: { body: req.body, authorization: req.headers['authorization'] }
    });

    await createErrorLogsEntry.perform(errorObj, errorLogsConstants.mediumSeverity);
    return responseHelper.renderApiResponse(errorObj, res, errorConfig);
  }

  next();
};

/**
 * Assign params
 *
 * @param req
 * @param res
 * @param next
 */
const assignParams = function(req, res, next) {
  // IMPORTANT NOTE: Don't assign parameters before sanitization
  // And assign it to req.decodedParams
  req.decodedParams = req.decodedParams || {};

  req.decodedParams.webhookParams = Object.assign(req.body);

  next();
};

router.use(validateZoomSignature, sanitizer.sanitizeBodyAndQuery, assignParams);

/* Listen to Zoom Events*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, sanitizer.sanitizeHeaderParams, function(req, res, next) {
  req.decodedParams.sanitized_headers = req.sanitizedHeaders;

  const performer = async function() {
    const response = await new ZoomEventCreateService(req.decodedParams).perform();

    return responseHelper.renderApiResponse(response, res, errorConfig);
  };

  performer();
});

module.exports = router;
