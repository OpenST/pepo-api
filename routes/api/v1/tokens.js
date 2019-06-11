const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/* Tokens*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.token;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.token,
      entities: [entityType.token],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/token/Get', 'r_a_v1_t_1', null, dataFormatterFunc));
});

module.exports = router;
