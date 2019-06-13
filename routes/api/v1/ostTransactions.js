const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Expression*/
router.post('/expression', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.expressionTransaction;

  Promise.resolve(routeHelper.perform(req, res, next, '/ostTransactions/Expression', 'r_a_v1_ot_1', null, null));
});

/* Send*/
router.post('/send', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.expressionTransaction;

  Promise.resolve(routeHelper.perform(req, res, next, '/ostTransactions/Expression', 'r_a_v1_ot_2', null, null));
});

module.exports = router;
