const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Validate topups request */
router.get('/validate', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.pepocornTopUpValidate;

  Promise.resolve(routeHelper.perform(req, res, next, '/pepocornTopUp/Validate', 'r_a_v1_pctu_1', null));
});

/* Get pepocorn balance. */
router.get('/balance', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.pepocornTopUpGetPepocornBalance;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.pepocornBalance,
      entityKindToResponseKeyMap: {
        [entityType.pepocornBalance]: responseEntityKey.pepocornBalance
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/pepocornTopUp/PepocornBalance', 'r_a_v1_pctu_2', null, dataFormatterFunc)
  );
});

module.exports = router;
