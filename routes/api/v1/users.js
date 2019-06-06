const express = require('express'),
  router = express.Router();

const rootPrefix = '../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  LoggedInUserFormatter = require(rootPrefix + '/lib/formatter/entity/LoggedInUser'),
  ChainFormatter = require(rootPrefix + '/lib/formatter/entity/Chain');

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
