const express = require('express'),
  router = express.Router();

const cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  AdminCookieAuth = require(rootPrefix + '/lib/authentication/AdminCookie'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  adminPreLaunchRoutes = require(rootPrefix + '/routes/api/admin/preLaunch/index'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

// Declare variables.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.admin);

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.ADMIN_COOKIE_SECRET));

const validateAdminCookie = async function(req, res, next) {
  // Cookie validation is not to be done for admin login request
  if (req.url !== '/login') {
    const adminCookieValue = req.signedCookies[adminConstants.loginCookieName];
    const authResponse = await new AdminCookieAuth(adminCookieValue).perform().catch(function(err) {
      return err;
    });

    if (authResponse.isFailure()) {
      cookieHelper.deleteAdminCookie(res);

      return responseHelper.renderApiResponse(authResponse, res, errorConfig);
    }

    req.decodedParams.current_admin = authResponse.data.current_admin;
    req.decodedParams.admin_login_cookie_value = authResponse.data.admin_login_cookie_value;

    cookieHelper.setAdminCookie(res, authResponse.data.admin_login_cookie_value);
  }

  next();
};

router.use(validateAdminCookie);
router.use(cookieHelper.setAdminCsrf());

/* Login admin */
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminLogin;

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setAdminCookie(res, serviceResponse.data.adminCookieValue);
  };

  const onServiceFailure = async function() {
    cookieHelper.deleteAdminCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/Login', 'r_a_v1_ad_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Logout admin */
router.post('/logout', sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.adminLogout;

  const responseObject = responseHelper.successWithData({});

  cookieHelper.deleteAdminCookie(res);

  Promise.resolve(responseHelper.renderApiResponse(responseObject, res, errorConfig));
});

/* Users list */
router.get('/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.searchResults,
      entityKindToResponseKeyMap: {
        [entityType.userSearchList]: responseEntityKey.searchResults,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.twitterUsersMap]: responseEntityKey.twitterUsers,
        [entityType.token]: responseEntityKey.token,
        [entityType.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    wrapperFormatterRsp.data.user_pepo_coins_map = serviceResponse.data.userPepoCoinsMap;
    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/UserSearch', 'r_a_v1_ad_2', null, dataFormatterFunc));
});

/* Approve user as creator */
router.post('/users/:user_id/approve', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserApprove;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/ApproveUsersAsCreator', 'r_a_v1_ad_3', null, null, null));
});

/* Block user */
router.post('/users/:user_id/block', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserBlock;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/BlockUser', 'r_a_v1_ad_4', null, null, null));
});

/* Video history for admin - intentionally retained the same api name */
router.get('/video-history/:profile_user_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userVideoList;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userVideoList,
      entityKindToResponseKeyMap: {
        [entityType.userVideoList]: responseEntityKey.userVideoList,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.userProfilesMap]: responseEntityKey.userProfiles,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token,
        [entityType.userVideoListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/GetVideoList', 'r_a_v1_u_5', null, dataFormatterFunc)
  );
});

/* Delete video */
router.post('/delete-video/:video_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminDeleteVideo;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/video/Delete', 'r_a_v1_ad_6', null, null, null));
});

/* Logged in Admin */
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

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/GetCurrent', 'r_a_v1_ad_7', null, dataFormatterFunc));
});

/* Logged in Admin */
router.get('/users/:user_id/balance', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userBalance;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.balance,
      entityKindToResponseKeyMap: {
        [entityType.balance]: responseEntityKey.balance
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/GetBalance', 'r_a_v1_ad_8', null, dataFormatterFunc));
});

router.use('/pre-launch', adminPreLaunchRoutes);

module.exports = router;
