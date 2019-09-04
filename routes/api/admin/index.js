const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser'),
  csrf = require('csurf');

const rootPrefix = '../../..',
  AdminCookieAuth = require(rootPrefix + '/lib/authentication/AdminCookie'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.admin);

const csrfProtection = csrf({
  cookie: {
    maxAge: 1000 * 5 * 60, // Cookie would expire after 5 minutes
    httpOnly: true, // The cookie only accessible by the web server
    signed: true, // Indicates if the cookie should be signed
    secure: true, // Marks the cookie to be used with HTTPS only
    path: '/',
    sameSite: 'strict', // sets the same site policy for the cookie
    domain: coreConstant.PA_COOKIE_DOMAIN,
    key: adminConstants.csrfCookieName
  }
});

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.ADMIN_COOKIE_SECRET));

const validateAdminCookie = async function(req, res, next) {
  // Cookie validation is not to be done for admin login request
  if (req.url !== '/login') {
    let adminCookieValue = req.signedCookies[adminConstants.loginCookieName];
    let authResponse = await new AdminCookieAuth(adminCookieValue).perform().catch(function(r) {
      return r;
    });

    if (authResponse.isFailure()) {
      cookieHelper.deleteAdminCookie(res);
      return responseHelper.renderApiResponse(authResponse, res, errorConfig);
    } else {
      req.decodedParams.current_admin = authResponse.data.current_admin;
      req.decodedParams.admin_login_cookie_value = authResponse.data.admin_login_cookie_value;
    }
    cookieHelper.setAdminCookie(res, authResponse.data.admin_login_cookie_value);
  }

  next();
};

router.use(validateAdminCookie);

/* Login admin*/
router.post('/login', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
router.post('/logout', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.adminLogout;

  const responseObject = responseHelper.successWithData({});

  cookieHelper.deleteAdminCookie(res);

  Promise.resolve(responseHelper.renderApiResponse(responseObject, res, errorConfig));
});

/* users list */
router.get('/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserSearch;
  req.decodedParams.search_by_admin = true;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.searchResults,
      entityKindToResponseKeyMap: {
        [entityType.userSearchList]: responseEntityKey.searchResults,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    wrapperFormatterRsp.data.adminActions = serviceResponse.data.adminActions;
    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/Search', 'r_a_v1_ad_2', null, dataFormatterFunc));
});

/* Approve user as creator */
router.post('/users/:user_id/approve', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserApprove;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/ApproveUsersAsCreator', 'r_a_v1_ad_3', null, null, null));
});

/* Block user*/
router.post('/users/:user_id/block', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserBlock;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/BlockUser', 'r_a_v1_ad_5', null, null, null));
});

/* Delete video */
router.post('/delete-video/:video_id', csrfProtection, sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminDeleteVideo;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/video/Delete', 'r_a_v1_ad_4', null, null, null));
});

/* Logged In Admin*/
router.get('/current', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.loggedInAdmin;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInAdmin,
      entityKindToResponseKeyMap: {
        [entityType.admin]: responseEntityKey.loggedInAdmin
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/GetCurrent', 'r_a_v1_u_5', null, dataFormatterFunc));
});

module.exports = router;
