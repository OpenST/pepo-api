const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/* Tokens*/
router.get('/search', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.gifs;

  const dataFormatterFunc = async function(serviceResponse) {
    console.log('Service Response: ', serviceResponse);
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.gifs,
      entities: [entityType.gifs],
      serviceData: serviceResponse.data.gifs
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/gifs/Search', 'r_a_v1_g_s_1', null, dataFormatterFunc));
});

module.exports = router;
