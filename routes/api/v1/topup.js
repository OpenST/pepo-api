const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get available products. */
router.get('/products', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTopupProducts;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.topupProducts,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.topupProducts]: responseEntityKey.topupProducts,
        [entityTypeConstants.topupLimitsData]: responseEntityKey.topupLimitsData
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/topup/GetProduct', 'r_a_v1_tu_1', null, dataFormatterFunc));
});

/* Create a topup using the payment receipt. */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.createTopup;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.topup,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.topup]: responseEntityKey.topup
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/topup/Create', 'r_a_v1_tu_2', null, dataFormatterFunc));
});

/* Get pending topups for the user. */
router.get('/pending', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getPendingTopups;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.pendingTopups,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.topupList]: responseEntityKey.pendingTopups
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/topup/GetPending', 'r_a_v1_tu_3', null, dataFormatterFunc));
});

/* Get topup entity using payment id / topup id. */
router.get('/:payment_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTopupById;
  req.decodedParams.payment_id = req.params.payment_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.topup,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.topup]: responseEntityKey.topup
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/topup/Get', 'r_a_v1_tu_4', null, dataFormatterFunc));
});

module.exports = router;
