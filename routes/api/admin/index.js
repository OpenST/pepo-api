const express = require('express'),
  router = express.Router();

const cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  AdminFormatterComposer = require(rootPrefix + '/lib/formatter/AdminComposer'),
  AdminCookieAuth = require(rootPrefix + '/lib/authentication/AdminCookie'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  adminPreLaunchRoutes = require(rootPrefix + '/routes/api/admin/preLaunch/index'),
  adminUpdateUsageDataRoutes = require(rootPrefix + '/routes/api/admin/updateUsageData/index'),
  adminResponseEntityKey = require(rootPrefix + '/lib/globalConstant/adminResponseEntity');

// Declare variables.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.admin);

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

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.ADMIN_COOKIE_SECRET));
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
    let entityTypeResponseKeyMap = {};

    if (serviceResponse.data[adminEntityType.userSearchList].length == 0) {
      entityTypeResponseKeyMap = {
        [adminEntityType.userSearchList]: adminResponseEntityKey.searchResults
      };
    } else {
      entityTypeResponseKeyMap = {
        [adminEntityType.userSearchList]: adminResponseEntityKey.searchResults,
        [adminEntityType.adminUsersMap]: adminResponseEntityKey.users,
        [adminEntityType.userStats]: adminResponseEntityKey.userStats,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.videosMap]: adminResponseEntityKey.videos,
        [adminEntityType.videoDescriptionsMap]: adminResponseEntityKey.videoDescriptions,
        [adminEntityType.videoDetailsMap]: adminResponseEntityKey.videoDetails,
        [adminEntityType.linksMap]: adminResponseEntityKey.links,
        [adminEntityType.adminTwitterUsersMap]: adminResponseEntityKey.twitterUsers,
        [adminEntityType.token]: adminResponseEntityKey.token,
        [adminEntityType.inviteCodesMap]: adminResponseEntityKey.inviteCodes,
        [adminEntityType.userSearchMeta]: adminResponseEntityKey.meta
      };
    }

    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.searchResults,
      entityKindToResponseKeyMap: entityTypeResponseKeyMap,
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

/* Deny user as creator */
router.post('/users/:user_id/deny', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserDeny;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/DenyUsersAsCreator', 'r_a_v1_ad_5', null, null, null));
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
  req.decodedParams.is_admin = true;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.userVideoList,
      entityKindToResponseKeyMap: {
        [adminEntityType.userVideoList]: adminResponseEntityKey.userVideoList,
        [adminEntityType.adminUsersMap]: adminResponseEntityKey.users,
        [adminEntityType.userStats]: adminResponseEntityKey.userStats,
        [adminEntityType.userProfilesMap]: adminResponseEntityKey.userProfiles,
        [adminEntityType.tagsMap]: adminResponseEntityKey.tags,
        [adminEntityType.linksMap]: adminResponseEntityKey.links,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.videosMap]: adminResponseEntityKey.videos,
        [adminEntityType.videoDetailsMap]: adminResponseEntityKey.videoDetails,
        [adminEntityType.videoDescriptionsMap]: adminResponseEntityKey.videoDescriptions,
        [adminEntityType.currentUserUserContributionsMap]: adminResponseEntityKey.currentUserUserContributions,
        [adminEntityType.currentUserVideoContributionsMap]: adminResponseEntityKey.currentUserVideoContributions,
        [adminEntityType.pricePointsMap]: adminResponseEntityKey.pricePoints,
        [adminEntityType.token]: adminResponseEntityKey.token,
        [adminEntityType.userVideoListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/GetVideoList', 'r_a_v1_u_5', null, dataFormatterFunc)
  );
});

/* Reply history for admin - intentionally retained the same api name */
router.get('/reply-history/:profile_user_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userReplyList;
  req.decodedParams.profile_user_id = req.params.profile_user_id;
  req.decodedParams.is_admin = true;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.userVideoList,
      entityKindToResponseKeyMap: {
        [adminEntityType.userVideoList]: adminResponseEntityKey.userVideoList,
        [adminEntityType.adminUsersMap]: adminResponseEntityKey.users,
        [adminEntityType.userStats]: adminResponseEntityKey.userStats,
        [adminEntityType.userProfilesMap]: adminResponseEntityKey.userProfiles,
        [adminEntityType.tagsMap]: adminResponseEntityKey.tags,
        [adminEntityType.linksMap]: adminResponseEntityKey.links,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.videosMap]: adminResponseEntityKey.videos,
        [adminEntityType.videoDetailsMap]: adminResponseEntityKey.videoDetails,
        [adminEntityType.videoDescriptionsMap]: adminResponseEntityKey.videoDescriptions,
        [adminEntityType.currentUserUserContributionsMap]: adminResponseEntityKey.currentUserUserContributions,
        [adminEntityType.currentUserVideoContributionsMap]: adminResponseEntityKey.currentUserVideoContributions,
        [adminEntityType.pricePointsMap]: adminResponseEntityKey.pricePoints,
        [adminEntityType.token]: adminResponseEntityKey.token,
        [adminEntityType.userVideoListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/GetVideoList', 'r_a_v1_u_5', null, dataFormatterFunc)
  );
});

/* Delete video. */
router.post('/delete-video/:video_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminDeleteVideo;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/DeleteVideo', 'r_a_v1_ad_6', null, null, null));
});

/* Delete reply video. */
router.post('/delete-reply-video/:reply_details_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminDeleteReplyVideo;
  req.decodedParams.reply_details_id = req.params.reply_details_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/reply/Delete', 'r_a_v1_ad_drv_1', null, null, null));
});

/* Update video link. */
router.post('/update-video/:video_id/link', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateVideoLink;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/video/UpdateLink', 'r_a_v1_ad_uvl_1', null, null, null));
});

/* Update video description. */
router.post('/update-video/:video_id/description', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateVideoDescription;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/video/UpdateVideoDescription', 'r_a_v1_ad_uvl_2', null, null, null)
  );
});

/* Logged in Admin */
router.get('/current', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.loggedInAdmin;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.loggedInAdmin,
      entityKindToResponseKeyMap: {
        [adminEntityType.admin]: adminResponseEntityKey.loggedInAdmin
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/GetCurrent', 'r_a_v1_ad_7', null, dataFormatterFunc));
});

/* User profile */
router.get('/users/:user_id/profile', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserProfile;
  req.decodedParams.profile_user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.adminUserProfile,
      entityKindToResponseKeyMap: {
        [adminEntityType.userProfile]: adminResponseEntityKey.adminUserProfile,
        [adminEntityType.adminUsersMap]: adminResponseEntityKey.users,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.userBalance]: adminResponseEntityKey.userBalance
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/UserProfile', 'r_a_v1_ad_8', null, dataFormatterFunc));
});

/* Get tags */
router.get('/tags', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminGetTags;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.tags,
      entityKindToResponseKeyMap: {
        [adminEntityType.tagList]: adminResponseEntityKey.tags,
        [adminEntityType.tagListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TagSearch', 'r_a_v1_ad_9', null, dataFormatterFunc));
});

router.use('/pre-launch', adminPreLaunchRoutes);
router.use('/update-usage-data', adminUpdateUsageDataRoutes);

module.exports = router;
