const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get token details. */
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.token;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.token,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/token/Get', 'r_a_v1_t_1', null, dataFormatterFunc));
});

module.exports = router;
