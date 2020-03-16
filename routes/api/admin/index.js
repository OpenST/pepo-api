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
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin/admin'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  adminResponseEntityKey = require(rootPrefix + '/lib/globalConstant/adminResponseEntity'),
  curatedEntitiesDataRoutes = require(rootPrefix + '/routes/api/admin/curatedEntity/index'),
  adminUpdateUsageDataRoutes = require(rootPrefix + '/routes/api/admin/updateUsageData/index');

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

    serviceResponse.data = {};
  };

  const onServiceFailure = async function() {
    cookieHelper.deleteAdminCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/Login', 'r_a_v1_ad_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Logout admin. */
router.post('/logout', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminLogout;

  const responseObject = responseHelper.successWithData({});

  cookieHelper.deleteAdminCookie(res);

  return res.status(200).json(responseObject); // Deliberately returning success response
});

/* Users list */
router.get('/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    let entityTypeResponseKeyMap = {};

    if (serviceResponse.data[adminEntityType.userSearchList].length === 0) {
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

/* Search channels. */
router.get('/channels', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminChannelSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.channelSearchResults,
      entityKindToResponseKeyMap: {
        [adminEntityType.channelSearchList]: adminResponseEntityKey.channelSearchResults,
        [adminEntityType.channelsMap]: adminResponseEntityKey.channels,
        [adminEntityType.channelDetailsMap]: adminResponseEntityKey.channelDetails,
        [adminEntityType.channelStatsMap]: adminResponseEntityKey.channelStats,
        [adminEntityType.currentUserChannelRelationsMap]: adminResponseEntityKey.currentUserChannelRelations,
        [adminEntityType.tagsMap]: adminResponseEntityKey.tags,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.linksMap]: adminResponseEntityKey.links,
        [adminEntityType.textsMap]: adminResponseEntityKey.texts,
        [adminEntityType.channelListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/ChannelSearch', 'r_a_v1_ad_22', null, dataFormatterFunc));
});

/* Approve user as creator */
router.post('/users/:user_id/approve', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserApprove;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/ApproveUsersAsCreator', 'r_a_v1_ad_3', null, null, null));
});

/* Mute User. */
router.post('/users/:user_id/mute', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.muteUser;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/MuteUser', 'r_a_v1_ad_4', null, null));
});

/* UnMute User. */
router.post('/users/:user_id/unmute', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.unMuteUser;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/UnMuteUser', 'r_a_v1_ad_5', null, null));
});

/* Deny user as creator */
router.post('/users/:user_id/deny', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserDeny;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/DenyUsersAsCreator', 'r_a_v1_ad_6', null, null, null));
});

/* Delete user */
router.post('/users/:user_id/delete', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserDelete;
  req.decodedParams.user_ids = [req.params.user_id];

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/DeleteUser', 'r_a_v1_ad_7', null, null, null));
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
        [adminEntityType.pricePointsMap]: adminResponseEntityKey.pricePoints,
        [adminEntityType.token]: adminResponseEntityKey.token,
        [adminEntityType.userVideoListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/GetVideoList', 'r_a_v1_ad_8', null, dataFormatterFunc)
  );
});

/* Get list of replies given video id. */
router.get('/videos/:video_id/replies', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.replyList;
  req.decodedParams.video_id = req.params.video_id;
  req.decodedParams.is_admin = true;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.videoReplies,
      entityKindToResponseKeyMap: {
        [adminEntityType.videoReplyList]: adminResponseEntityKey.videoReplies,
        [adminEntityType.adminUsersMap]: adminResponseEntityKey.users,
        [adminEntityType.userStats]: adminResponseEntityKey.userStats,
        [adminEntityType.userProfilesMap]: adminResponseEntityKey.userProfiles,
        [adminEntityType.videoDescriptionsMap]: adminResponseEntityKey.videoDescriptions,
        [adminEntityType.tagsMap]: adminResponseEntityKey.tags,
        [adminEntityType.linksMap]: adminResponseEntityKey.links,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.videosMap]: adminResponseEntityKey.videos,
        [adminEntityType.replyDetailsMap]: adminResponseEntityKey.replyDetails,
        [adminEntityType.pricePointsMap]: adminResponseEntityKey.pricePoints,
        [adminEntityType.token]: adminResponseEntityKey.token,
        [adminEntityType.userVideoListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/List', 'r_a_v1_ad_9', null, dataFormatterFunc));
});

/* Delete video. */
router.post('/delete-video/:video_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminDeleteVideo;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/DeleteVideo', 'r_a_v1_ad_10', null, null, null));
});

/* Delete reply video. */
router.post('/delete-reply-video/:reply_details_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminDeleteReplyVideo;
  req.decodedParams.reply_details_id = req.params.reply_details_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/reply/Delete', 'r_a_v1_ad_11', null, null, null));
});

/* Update video link. */
router.post('/update-video/:video_id/link', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateVideoLink;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/video/UpdateLink', 'r_a_v1_ad_12', null, null, null));
});

/* Update reply video link. */
router.post('/update-reply-video/:reply_detail_id/link', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateReplyLink;
  req.decodedParams.reply_detail_id = req.params.reply_detail_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/reply/UpdateReplyLink', 'r_a_v1_ad_13', null, null, null)
  );
});

/* Update video description. */
router.post('/update-video/:video_id/description', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUpdateVideoDescription;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/video/UpdateVideoDescription', 'r_a_v1_ad_14', null, null, null)
  );
});

/* Update video reply description. */
router.post('/update-reply-video/:reply_detail_id/description', sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.adminUpdateReplyDescription;
  req.decodedParams.reply_detail_id = req.params.reply_detail_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/reply/UpdateReplyDescription', 'r_a_v1_ad_15', null, null, null)
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

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/GetCurrent', 'r_a_v1_ad_16', null, dataFormatterFunc));
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
        [adminEntityType.globalUserMuteDetailsMap]: adminResponseEntityKey.globalUserMuteDetails,
        [adminEntityType.imagesMap]: adminResponseEntityKey.images,
        [adminEntityType.userBalance]: adminResponseEntityKey.userBalance
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/UserProfile', 'r_a_v1_ad_17', null, dataFormatterFunc));
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

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TagSearch', 'r_a_v1_ad_18', null, dataFormatterFunc));
});

/* Get video by video id */
router.get('/videos/:video_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getVideo;
  req.decodedParams.video_id = req.params.video_id;
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
        [adminEntityType.videoDescriptionsMap]: adminResponseEntityKey.videoDescriptions,
        [adminEntityType.videoDetailsMap]: adminResponseEntityKey.videoDetails,
        [adminEntityType.userVideoListMeta]: adminResponseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/video/GetById', 'r_a_v1_ad_19', null, dataFormatterFunc));
});

/* Send resubmission email */
router.post('/users/:user_id/send-resubmission-email', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminSendEmailForResubmission;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(
    routeHelper.perform(req, res, next, '/admin/SendEmailForReSubmission', 'r_a_v1_ad_20', null, null, null)
  );
});

/* Block user from channel. */
router.post('/channels/:channel_id/block-user', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.adminUserBlockInChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/BlockUserInChannel', 'r_a_v1_ad_21', null, null, null));
});

router.use('/update-usage-data', adminUpdateUsageDataRoutes);
router.use('/curated-entities', curatedEntitiesDataRoutes);

module.exports = router;
