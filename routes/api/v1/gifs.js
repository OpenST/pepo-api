const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Gifs*/
router.get('/search', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.gifsSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: entityType.gifs,
      entityKindToResponseKeyMap: {
        [entityType.gifs]: responseEntityKey.gifs,
        [entityType.gifsSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/gifs/Search', 'r_a_v1_g_s_1', null, dataFormatterFunc));
});

router.get('/trending', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.gifsTrending;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: entityType.gifs,
      entityKindToResponseKeyMap: {
        [entityType.gifs]: responseEntityKey.gifs,
        [entityType.gifsSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/gifs/Trending', 'r_a_v1_g_t_1', null, dataFormatterFunc));
});

router.get('/categories', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.gifsCategories;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.gifCategories,
      entityKindToResponseKeyMap: {
        [entityType.gifMap]: responseEntityKey.gifs,
        [entityType.gifCategories]: responseEntityKey.gifCategories
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/gifs/GetCategories', 'r_a_v1_g_c_1', null, dataFormatterFunc));
});

module.exports = router;
