const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

/* Fetch go-to */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.fetchGoto;

  const dataFormatterFunc = async function(serviceResponse) {
    console.log('serviceResponse---', JSON.stringify(serviceResponse));
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.goto,
      entityKindToResponseKeyMap: {
        [entityType.goto]: responseEntityKey.goto
      },
      serviceData: serviceResponse.data
    }).perform();

    console.log('wrapperFormatterRsp------', wrapperFormatterRsp);

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/FetchGoto', 'r_a_v1_fgt_1', null, dataFormatterFunc));
});

module.exports = router;
