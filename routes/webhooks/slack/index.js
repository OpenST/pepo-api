const express = require('express');

const rootPrefix = '../../..',
  SlackEventFactory = require(rootPrefix + '/app/services/slackEvents/Factory'),
  SlackWebhookAuth = require(rootPrefix + '/lib/authentication/SlackWebhook'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const router = express.Router();

const validateSlackSignature = async function(req, res, next) {
  let authResponse;

  authResponse = await new SlackWebhookAuth({
    rawBody: req.rawBody,
    webhookParams: req.decodedParams.webhookParams,
    requestHeaders: req.headers
  })
    .perform()
    .catch(function(r) {
      return r;
    });

  if (authResponse.isFailure()) {
    return responseHelper.renderApiResponse(authResponse, res, errorConfig);
  }

  req.decodedParams.current_admin = authResponse.data.current_admin;

  next();
};

/**
 * Convert String to Json
 *
 * @param req
 * @param res
 * @param next
 */
const formatPayload = function(req, res, next) {
  req.body.payload = JSON.parse(req.body.payload);
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

router.use(formatPayload, sanitizer.sanitizeBodyAndQuery, assignParams, validateSlackSignature);

// /* Listen to Slack Events*/
// router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
//   const performer = async function() {
//     let response = responseHelper.successWithData({});
//     // let response = responseHelper.error({
//     //   internal_error_identifier: 'r_a_w_pl_7',
//     //   api_error_identifier: 'resource_not_found',
//     //   debug_options: {}
//     // });
//
//     return responseHelper.renderApiResponse(response, res, errorConfig);
//
//     if (response.success) {
//       return res.status(200).json({});
//     } else {
//       let status = response._fetchHttpCode(errorConfig.api_error_config || {});
//       let errorResponse = response.toHash(errorConfig);
//
//       let formattedResponse = {
//         response_type: 'ephermal',
//         replace_original: false,
//         text: 'DUMMY ERROR'
//       };
//
//       return res.status(status).json(formattedResponse);
//     }
//
//     // let response = await new SlackEventFactory(req.decodedParams).perform();
//   };
//
//   performer();
// });

/* Listen to Slack Events*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const performer = async function() {
    let response = await new SlackEventFactory(req.decodedParams).perform();
    return responseHelper.renderApiResponse(response, res, errorConfig);
  };

  performer();
});

module.exports = router;
