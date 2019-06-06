const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/entity/RecoveryInfo');

/* Register Device*/
router.get('/register-device', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.registerDevice;

  const dataFormatterFunc = async function(serviceResponse) {
    const chainFormattedRsp = new LoggedInUserFormatter(serviceResponse.data[resultType.chain]).perform();
    serviceResponse.data = {
      result_type: resultType.chain,
      [resultType.chain]: chainFormattedRsp.data
    };
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/app/services/chain/Get', 'r_v2_c_1', null, dataFormatterFunc));
});

/* Recovery Info Device*/
router.get('/recovery-info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.recoveryInfo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: resultType.recoveryInfo,
      entities: [resultType.recoveryInfo],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/userManagement/RecoveryInfo', 'r_a_v1_u_2', null, dataFormatterFunc)
  );
});

module.exports = router;
