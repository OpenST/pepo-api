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
    webhookParams: req.body,
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

router.use(validateSlackSignature, sanitizer.sanitizeBodyAndQuery, assignParams);

/* Listen to Ost Events*/
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  const performer = async function() {
    let response = await new SlackEventFactory(req.decodedParams).perform();
    return responseHelper.renderApiResponse(response, res, errorConfig);
  };

  performer();
});

module.exports = router;
