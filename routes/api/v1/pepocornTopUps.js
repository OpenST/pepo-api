const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get pepocorn info. */
router.get('/info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.pepocornTopUpInfo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.pepocornTopupInfo,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.pepocornTopupInfo]: responseEntityKey.pepocornTopupInfo,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
    // serviceResponse.data['app_upgrade'] = pepocornProductConstants.appUpgradeEntity;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/pepocornTopUp/GetInfo', 'r_a_v1_pctu_1', null, dataFormatterFunc)
  );
});

/* Validate topups request */
router.get('/validate', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.pepocornTopUpValidate;

  Promise.resolve(routeHelper.perform(req, res, next, '/pepocornTopUp/Validate', 'r_a_v1_pctu_2', null));
});

/* Get pepocorn balance. */
router.get('/balance', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.pepocornTopUpGetPepocornBalance;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.pepocornBalance,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.pepocornBalance]: responseEntityKey.pepocornBalance
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/pepocornTopUp/PepocornBalance', 'r_a_v1_pctu_3', null, dataFormatterFunc)
  );
});

module.exports = router;
