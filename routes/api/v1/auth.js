const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
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

/* Create user*/
router.post('/sign-up', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.signUp;

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);

    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.user]: responseEntityKey.loggedInUser
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    cookieHelper.deleteLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/SignUp', 'r_a_v1_a_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Login user*/
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.login;

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.user]: responseEntityKey.loggedInUser
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    cookieHelper.deleteLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/Login', 'r_a_v1_a_2', null, onServiceSuccess, onServiceFailure)
  );
});

/* Logout user*/
router.post('/logout', sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.logout;

  const errorConfig = basicHelper.fetchErrorConfig(req.decodedParams.apiVersion),
    responseObject = responseHelper.successWithData({});

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(responseObject.renderResponse(res, errorConfig));
});

module.exports = router;
