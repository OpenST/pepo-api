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
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

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
  // Cookie validation is not to be done for preLaunch login request
  if (req.url !== '/twitter-login') {
    let preLaunchCookieValue = req.signedCookies[preLaunchInviteConstants.loginCookieName];
    let authResponse = await new PreLaunchInviteLoginCookieAuth(preLaunchCookieValue).perform().catch(function(r) {
      return r;
    });

    if (authResponse.isFailure()) {
      cookieHelper.deletePreLaunchInviteCookie(res);
      return responseHelper.renderApiResponse(authResponse, res, errorConfig);
    } else {
      req.decodedParams.current_pre_launch_invite = authResponse.data.current_preLaunch;
    }
    cookieHelper.setPreLaunchInviteCookie(res, authResponse.data.preLaunchInviteLoginCookieValue);
  }

  next();
};

// router.use(validatePreLaunchInviteCookie);

/* Login preLaunch*/
router.post('/twitter-login', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.preLaunchInviteLogin;

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
      '/preLaunchInvite/Login',
      'r_a_w_pl_1',
      null,
      onServiceSuccess,
      onServiceFailure
    )
  );
});

// /* Logged In Pre Launch Invite User*/
// router.get('/current', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
//   req.decodedParams.apiName = apiName.loggedInAdmin;
//
//   const dataFormatterFunc = async function(serviceResponse) {
//     const wrapperFormatterRsp = await new FormatterComposer({
//       resultType: responseEntityKey.loggedInAdmin,
//       entityKindToResponseKeyMap: {
//         [entityType.admin]: responseEntityKey.loggedInAdmin
//       },
//       serviceData: serviceResponse.data
//     }).perform();
//
//     serviceResponse.data = wrapperFormatterRsp.data;
//   };
//
//   Promise.resolve(routeHelper.perform(req, res, next, '/admin/GetCurrent', 'r_a_w_pl_2', null, dataFormatterFunc));
// });

module.exports = router;
