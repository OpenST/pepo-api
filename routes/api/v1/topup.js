const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

// Get available products
router.get('/products', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTopupProduct;

  const onServiceSuccess = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.products,
      entityKindToResponseKeyMap: {
        [entityType.products]: responseEntityKey.products,
        [entityType.limitsData]: responseEntityKey.limitsData
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/topup/GetProduct', 'r_a_v1_u_15', null, onServiceSuccess));
});

// Create a topup using the payment receipt
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.confirmPayReceipt;

  const onServiceSuccess = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userTopupEntity,
      entityKindToResponseKeyMap: {
        [entityType.userTopUp]: responseEntityKey.userTopupEntity
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/payment/ProcessValidator', 'r_a_v1_p_2', null, onServiceSuccess)
  );
});

// Get pending topups for the user
router.get('/pending', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userTopUps;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.pendingTopups,
      entityKindToResponseKeyMap: {
        [entityType.userTopUpsList]: responseEntityKey.pendingTopups
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/PendingTopUps', 'r_a_v1_u_16', null, dataFormatterFunc));
});

// Get topup entity using payment id / topup id
router.get('/:payment_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.paymentDetails;
  req.decodedParams.payment_id = req.params.payment_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userTopupEntity,
      entityKindToResponseKeyMap: {
        [entityType.userTopUp]: responseEntityKey.userTopupEntity
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/GetPaymentDetails', 'r_a_v1_u_17', null, dataFormatterFunc)
  );
});

module.exports = router;
