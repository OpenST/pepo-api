const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

/* Redemption products list.*/
router.get(
  '/products',
  cookieHelper.parseStoreLoginCookieIfPresent,
  sanitizer.sanitizeDynamicUrlParams,
  cookieHelper.validateStoreTokenIfPresent,
  cookieHelper.validateUserLoginRequired,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.getRedemptionProducts;

    const dataFormatterFunc = async function(serviceResponse) {
      const wrapperFormatterRsp = await new FormatterComposer({
        resultType: responseEntityKey.redemptionsProductList,
        entityKindToResponseKeyMap: {
          [entityTypeConstants.redemptionsProductList]: responseEntityKey.redemptionsProductList
        },
        serviceData: serviceResponse.data
      }).perform();

      serviceResponse.data = wrapperFormatterRsp.data;
    };

    Promise.resolve(
      routeHelper.perform(req, res, next, '/redemption/GetProductList', 'r_a_w_r_p_1', null, dataFormatterFunc)
    );
  }
);

router.use(cookieHelper.validateStoreLoginCookieIfPresent, cookieHelper.validateUserLoginRequired);

// Request for redemption of a product.
router.post('/request', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.initiateRedemptionRequest;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.redemption,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.redemption]: responseEntityKey.redemption
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/redemption/InitiateRequest', 'r_sa_w_r_1', null, dataFormatterFunc)
  );
});

/* Get pepocorn balance. */
router.get('/pepocorn-balance', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.redemptionPepocornBalance;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.pepocornBalance,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.pepocornBalance]: responseEntityKey.pepocornBalance
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/redemption/PepocornBalance', 'r_sa_w_r_2', null, dataFormatterFunc)
  );
});

module.exports = router;
