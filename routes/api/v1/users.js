const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Register Device*/
router.post('/register-device', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.registerDevice;

  const onServiceSuccess = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.device,
      entityKindToResponseKeyMap: {
        [entityType.device]: responseEntityKey.device
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/init/RegisterDevice', 'r_a_v1_u_1', null, onServiceSuccess)
  );
});

/* Recovery Info Device*/
router.get('/recovery-info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.recoveryInfo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.recoveryInfo,
      entityKindToResponseKeyMap: {
        [entityType.recoveryInfo]: responseEntityKey.recoveryInfo
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/init/RecoveryInfo', 'r_a_v1_u_2', null, dataFormatterFunc)
  );
});

/* Contributed To Users List */
router.get('/:profile_user_id/contribution-to', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.contributionTo;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.contributionToUsers,
      entityKindToResponseKeyMap: {
        [entityType.users]: responseEntityKey.contributionToUsers,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userListMeta]: responseEntityKey.meta,
        [entityType.userContributionToStatsMap]: responseEntityKey.userContributionToStats
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/contribution/To', 'r_a_v1_u_ct_1', null, dataFormatterFunc)
  );
});

/* Contributed By Users List */
router.get('/:profile_user_id/contribution-by', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.contributionBy;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.contributionByUsers,
      entityKindToResponseKeyMap: {
        [entityType.users]: responseEntityKey.contributionByUsers,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userListMeta]: responseEntityKey.meta,
        [entityType.userContributionByStatsMap]: responseEntityKey.userContributionByStats
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/contribution/By', 'r_a_v1_u_cb_1', null, dataFormatterFunc)
  );
});

/* User Suggestion to Logged IN User */
router.get('/:profile_user_id/contribution-suggestion', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.contributionSuggestion;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.contributionSuggestions,
      entityKindToResponseKeyMap: {
        [entityType.users]: responseEntityKey.contributionSuggestions,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/contribution/Suggestion', 'r_a_v1_u_cs_1', null, dataFormatterFunc)
  );
});

/* User Activation Initiated Api call*/
router.post('/activation-initiate', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.activationInitiate;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.activationInitiate,
      entityKindToResponseKeyMap: {
        [entityType.loggedInUser]: responseEntityKey.loggedInUser,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/init/ActivationInitiate', 'r_a_v1_u_ai_1', null, dataFormatterFunc)
  );
});

/* Logged In User*/
router.get('/current', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.loggedInUser;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.loggedInUser]: responseEntityKey.loggedInUser,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/init/GetCurrent', 'r_a_v1_u_5', null, dataFormatterFunc));
});

/* User profile */
router.get('/:profile_user_id/profile', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getUserProfile;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userProfile,
      entityKindToResponseKeyMap: {
        [entityType.userProfile]: responseEntityKey.userProfile,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.userProfileAllowedActions]: responseEntityKey.userProfileAllowedActions,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.twitterUsersMap]: responseEntityKey.twitterUsers
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/Get', 'r_a_v1_u_7', null, dataFormatterFunc));
});

/* Get email for current user. */
router.get('/email', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getEmail;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.email,
      entityKindToResponseKeyMap: {
        [entityType.email]: responseEntityKey.email
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/user/GetEmail', 'r_a_v1_u_12', null, dataFormatterFunc));
});

/* Video save */
router.post('/:profile_user_id/fan-video', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveFanVideo;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userVideoList,
      entityKindToResponseKeyMap: {
        [entityType.userVideoList]: responseEntityKey.userVideoList
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/update/FanVideo', 'r_a_v1_u_9', null, dataFormatterFunc)
  );
});

/* Profile image save */
router.post('/:profile_user_id/profile-image', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveProfileImage;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/update/ProfileImage', 'r_a_v1_u_10', null));
});

/* Profile save */
router.post('/:profile_user_id/profile', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveProfile;
  req.decodedParams.profile_user_id = req.params.profile_user_id;
  logger.log('req.decodedParams.name', req.decodedParams.name);
  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/update/Info', 'r_a_v1_u_11', null));
});

/* Save email in profile. */
router.post('/:profile_user_id/save-email', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.saveEmail;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/SaveEmail', 'r_a_v1_u_12', null));
});

/* Video history */
router.get('/:profile_user_id/video-history', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
        [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityType.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token,
        [entityType.userVideoListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/GetVideoList', 'r_a_v1_u_13', null, dataFormatterFunc)
  );
});

/* Reply history */
router.get('/:profile_user_id/reply-history', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userReplyList;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userReplies,
      entityKindToResponseKeyMap: {
        [entityType.userReplyList]: responseEntityKey.userReplies,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.userProfilesMap]: responseEntityKey.userProfiles,
        [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.replyDetailsMap]: responseEntityKey.replyDetails,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token,
        [entityType.userVideoListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/UserReplies', 'r_a_v1_u_20', null, dataFormatterFunc));
});

/* User websocket details*/
router.get('/:user_id/websocket-details', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.websocketDetails;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.websocketConnectionPayload,
      entityKindToResponseKeyMap: {
        [entityType.websocketConnectionPayload]: responseEntityKey.websocketConnectionPayload
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/SocketConnectionDetails', 'r_a_v1_u_17', null, dataFormatterFunc)
  );
});

/* Reset badge count. */
router.post('/:user_id/reset-badge', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.resetBadge;
  req.decodedParams.user_id = req.params.user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/ResetBadge', 'r_a_v1_u_16', null, null));
});

/* Thank You */
router.post('/thank-you', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.sayThankYou;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/notification/SayThankYou', 'r_a_v1_u_14', null));
});

/* User search. */
router.get('/search', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userSearchResults,
      entityKindToResponseKeyMap: {
        [entityType.userSearchList]: responseEntityKey.userSearchResults,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/UserSearch', 'r_a_v1_u_15', null, dataFormatterFunc));
});

/* Block other user's profile for current user. */
router.post('/:profile_user_id/block', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.blockOtherUserForUser;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/BlockOtherUserForUser', 'r_a_v1_u_16', null));
});

/* Block other user's profile for current user. */
router.post('/:profile_user_id/unblock', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.unBlockOtherUserForUser;
  req.decodedParams.profile_user_id = req.params.profile_user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/profile/UnBlockOtherUserForUser', 'r_a_v1_u_17', null));
});

/* Mute User. */
router.post('/:other_user_id/mute', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.muteUser;
  req.decodedParams.other_user_id = req.params.other_user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/Mute', 'r_a_v1_u_18', null));
});

/* UnMute User. */
router.post('/:other_user_id/unmute', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.unMuteUser;
  req.decodedParams.other_user_id = req.params.other_user_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/user/UnMute', 'r_a_v1_u_19', null));
});

module.exports = router;
