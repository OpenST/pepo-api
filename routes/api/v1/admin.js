const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

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

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

/* Login admin*/
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminLogin;

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setAdminCookie(res, serviceResponse.data.adminCookieValue);
  };

  const onServiceFailure = async function(serviceResponse) {
    cookieHelper.deleteAdminCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/Login', 'r_a_v1_ad_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Logout admin*/
router.post('/logout', sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.adminLogout;

  const errorConfig = basicHelper.fetchErrorConfig(req.decodedParams.apiVersion),
    responseObject = responseHelper.successWithData({});

  cookieHelper.deleteAdminCookie(res);

  Promise.resolve(responseHelper.renderApiResponse(responseObject, res, errorConfig));
});

module.exports = router;
