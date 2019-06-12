const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/* User Feeds*/
router.get('/my-feed', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.myFeed;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.feeds,
      entities: [entityType.feeds],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/User', 'r_a_v1_f_1', null, dataFormatterFunc));
});

/* Public Feeds*/
router.get('/public-feed', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.publicFeed;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.feeds,
      entities: [entityType.feeds],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/Public', 'r_a_v1_f_2', null, dataFormatterFunc));
});

module.exports = router;
