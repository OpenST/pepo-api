const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser'),
  csrf = require('csurf');

const rootPrefix = '../../..',
  PreLaunchInviteLoginCookieAuth = require(rootPrefix + '/lib/authentication/PreLaunchInviteLoginCookie'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.web);

const csrfProtection = csrf({
  cookie: {
    maxAge: 1000 * 5 * 60, // Cookie would expire after 5 minutes
    httpOnly: true, // The cookie only accessible by the web server
    signed: true, // Indicates if the cookie should be signed
    secure: true, // Marks the cookie to be used with HTTPS only
    path: '/',
    sameSite: 'strict', // sets the same site policy for the cookie
    domain: coreConstant.PA_COOKIE_DOMAIN,
    key: preLaunchInviteConstants.csrfCookieName
  }
});

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.WEB_COOKIE_SECRET));

const validatePreLaunchInviteCookie = async function(req, res, next) {
  let preLaunchCookieValue = req.signedCookies[preLaunchInviteConstants.loginCookieName];
  let authResponse = await new PreLaunchInviteLoginCookieAuth(preLaunchCookieValue).perform().catch(function(r) {
    return r;
  });

  if (authResponse.isFailure()) {
    cookieHelper.deletePreLaunchInviteCookie(res);
    return responseHelper.renderApiResponse(authResponse, res, errorConfig);
  } else {
    req.decodedParams.current_pre_launch_invite = authResponse.data.current_pre_launch_invite;
  }
  cookieHelper.setPreLaunchInviteCookie(res, authResponse.data.preLaunchInviteLoginCookieValue);

  next();
};

/* Account Info */
router.get('/account', validatePreLaunchInviteCookie, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.preLaunchAccountGet;

  Promise.resolve(routeHelper.perform(req, res, next, '/preLaunchInvite/Account', 'r_a_w_pl_1', null, null));
});

/* Request Token preLaunch*/
router.get('/twitter/request_token', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterRequestToken;

  const onServiceSuccess = async function(serviceResponse) {
    if (serviceResponse.data.dataCookieValue) {
      cookieHelper.setPreLaunchDataCookie(res, serviceResponse.data.dataCookieValue);
    }
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/preLaunchInvite/RequestToken', 'r_a_w_pl_2', null, onServiceSuccess)
  );
});

/* Login preLaunch*/
router.get('/twitter-login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.preLaunchInviteVerify;
  let dataCookieValue = req.signedCookies[preLaunchInviteConstants.dataCookieName];

  if (dataCookieValue) {
    dataCookieValue = JSON.parse(dataCookieValue);
    req.decodedParams.i = dataCookieValue.i;
  }

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setPreLaunchInviteCookie(res, serviceResponse.data.preLaunchInviteLoginCookieValue);
  };

  const onServiceFailure = async function(serviceResponse) {
    cookieHelper.deletePreLaunchInviteCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(
      req,
      res,
      next,
      '/preLaunchInvite/Verify',
      'r_a_w_pl_3',
      null,
      onServiceSuccess,
      onServiceFailure
    )
  );
});

/* Logout pre launch user*/
router.post('/logout', sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.preLaunchLogout;

  const responseObject = responseHelper.successWithData({});

  cookieHelper.deletePreLaunchInviteCookie(res);

  Promise.resolve(responseHelper.renderApiResponse(responseObject, res, errorConfig));
});

module.exports = router;
