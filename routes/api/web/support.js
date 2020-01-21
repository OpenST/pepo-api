const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
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
