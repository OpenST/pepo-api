const express = require('express');

const rootPrefix = '../..',
  OstWebhookAuth = require(rootPrefix + '/lib/authentication/OstWebhook'),
  v2Routes = require(rootPrefix + '/routes/ostWebhook/v2/index'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const router = express.Router();

const validateV2Signature = async function(req, res, next) {
  let authResponse;

  authResponse = await new OstWebhookAuth({ webhookParams: req.body, requestHeaders: req.headers })
    .perform()
    .catch(function(r) {
      return r;
    });

  if (authResponse.isFailure()) {
    return authResponse.renderResponse(res);
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
  req.decodedParams.webhookParams = Object.assign(req.body);

  next();
};

router.use('/v2', validateV2Signature, sanitizer.sanitizeBodyAndQuery, assignParams, v2Routes);

module.exports = router;
