const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Validate support url. */
router.get(
  '/',
  cookieHelper.validateWebviewLoginCookieIfPresent,
  sanitizer.sanitizeDynamicUrlParams,
  cookieHelper.validateTokenIfPresent,
  cookieHelper.validateUserLoginRequired,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.validateSupportUrl;

    const dataFormatterFunc = async function(serviceResponse) {
      const wrapperFormatterRsp = await new FormatterComposer({
        resultType: responseEntityKey.supportValidation,
        entityKindToResponseKeyMap: {
          [entityTypeConstants.supportValidation]: responseEntityKey.supportValidation
        },
        serviceData: serviceResponse.data
      }).perform();

      serviceResponse.data = wrapperFormatterRsp.data;
    };

    Promise.resolve(routeHelper.perform(req, res, next, '/support/Validate', 'r_a_w_s_1', null, dataFormatterFunc));
  }
);

module.exports = router;
