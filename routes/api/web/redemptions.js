const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

/* Subscribe email*/
router.get(
  '/products',
  cookieHelper.parseWebviewLoginCookieIfPresent,
  sanitizer.sanitizeDynamicUrlParams,
  cookieHelper.validateTokenIfPresent,
  cookieHelper.validateUserLoginRequired,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.getRedemptionProducts;

    Promise.resolve(routeHelper.perform(req, res, next, '/redemption/GetProductList', 'r_a_w_r_p_1', null));
  }
);

router.use(cookieHelper.validateWebviewLoginCookieIfPresent, cookieHelper.validateUserLoginRequired);

// Request for redemption of a product
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.requestRedemption;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.redemption,
      entityKindToResponseKeyMap: {
        [entityType.redemption]: responseEntityKey.redemption
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/redemption/Request', 'r_a_w_r_2', null, dataFormatterFunc));
});

module.exports = router;
