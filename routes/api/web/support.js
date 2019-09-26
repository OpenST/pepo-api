const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.COOKIE_SECRET));

/* Subscribe email*/
router.get(
  '/',
  cookieHelper.validateWebviewLoginCookieIfPresent,
  sanitizer.sanitizeDynamicUrlParams,
  cookieHelper.validateTokenIfPresent,
  cookieHelper.validateUserLoginRequired,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.validateSupportUrl;

    Promise.resolve(routeHelper.perform(req, res, next, '/support/Validate', 'r_a_w_s_1', null));
  }
);

module.exports = router;
