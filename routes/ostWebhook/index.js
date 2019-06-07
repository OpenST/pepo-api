'use strict';

const express = require('express');
const router = express.Router();

const rootPrefix = '../..',
  v2Routes = require(rootPrefix + '/routes/ostWebhook/v2/index'),
  OstWebhookAuth = require(rootPrefix + '/lib/authentication/OstWebhook'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

const validateV2Signature = async function(req, res, next) {
  req.decodedParams = Object.assign(req.body, req.decodedParams);

  let authResponse;

  authResponse = await new OstWebhookAuth({ decodedParams: req.decodedParams }).perform().catch(function(r) {
    return r;
  });

  if (authResponse.isFailure()) {
    return authResponse.renderResponse(res);
  }

  next();
};

router.use('/v2', validateV2Signature, sanitizer.sanitizeBodyAndQuery, v2Routes);

module.exports = router;
