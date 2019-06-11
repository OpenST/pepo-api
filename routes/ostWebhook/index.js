'use strict';

const express = require('express');

const rootPrefix = '../..',
  OstWebhookAuth = require(rootPrefix + '/lib/authentication/OstWebhook'),
  v2Routes = require(rootPrefix + '/routes/ostWebhook/v2/index'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const router = express.Router();

const validateV2Signature = async function(req, res, next) {
  // TODO: Decoded params can't be merged directly in body json data from OST
  req.decodedParams = Object.assign(req.body, req.decodedParams);

  let authResponse;

  // TODO: For signature verification complete decoded params can't be sent. sent req.body
  authResponse = await new OstWebhookAuth({ webhookParams: req.decodedParams, requestHeaders: req.headers })
    .perform()
    .catch(function(r) {
      return r;
    });

  if (authResponse.isFailure()) {
    return authResponse.renderResponse(res);
  }

  next();
};

router.use('/v2', validateV2Signature, sanitizer.sanitizeBodyAndQuery, v2Routes);

module.exports = router;
