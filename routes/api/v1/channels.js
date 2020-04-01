const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get url and message for sharing channel given its id. */
router.get('/:channel_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelShare;
  req.decodedParams.channel_id = Number(req.params.channel_id);

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.share,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.share]: responseEntityKey.share
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/ShareDetails', 'r_a_v1_c_6', null, dataFormatterFunc));
});

// User should be logged in to access all the further routes.
router.use(cookieHelper.validateUserLoginRequired);

/* Get channel details. */
router.get('/:channel_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getChannelDetails;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.channel,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.channel]: responseEntityKey.channel,
        [entityTypeConstants.channelDetailsMap]: responseEntityKey.channelDetails,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats,
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.textsMap]: responseEntityKey.texts
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/Get', 'r_a_v1_c_1', null, dataFormatterFunc));
});

/* Create new channel by user. */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.createChannel;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.currentUserChannelRelations,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Join', 'r_a_v1_c_2', null, dataFormatterFunc));
});

/* Edit new channel by user. */
router.post('/:channel_id/edit', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.editChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.currentUserChannelRelations,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Join', 'r_a_v1_c_2', null, dataFormatterFunc));
});

/* Join channel by user. */
router.post('/:channel_id/join', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.joinChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.currentUserChannelRelations,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Join', 'r_a_v1_c_2', null, dataFormatterFunc));
});

/* Leave channel by user. */
router.post('/:channel_id/leave', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.leaveChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.currentUserChannelRelations,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Leave', 'r_a_v1_c_3', null, dataFormatterFunc));
});

/* Mute notification for channel user. */
router.post('/:channel_id/turn-off-notifications', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.turnOffChannelNotifications;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.currentUserChannelRelations,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/channel/user/TurnOffNotifications', 'r_a_v1_c_7', null, dataFormatterFunc)
  );
});

/* Mute notification for channel user. */
router.post('/:channel_id/turn-on-notifications', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.turnOffChannelNotifications;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.currentUserChannelRelations,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/channel/user/TurnOnNotifications', 'r_a_v1_c_8', null, dataFormatterFunc)
  );
});

/* Fetch videos of a channel. */
router.get('/:channel_id/videos', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getChannelVideos;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.channelVideoList,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.channelVideoList]: responseEntityKey.channelVideoList,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.videosMap]: responseEntityKey.videos,
        [entityTypeConstants.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityTypeConstants.channelsMap]: responseEntityKey.channels,
        [entityTypeConstants.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityTypeConstants.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityTypeConstants.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityTypeConstants.userProfileAllowedActions]: responseEntityKey.userProfileAllowedActions,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints,
        [entityTypeConstants.token]: responseEntityKey.token,
        [entityTypeConstants.channelVideosListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/GetVideoList', 'r_a_v1_c_4', null, dataFormatterFunc));
});

/* Fetch users of a channel. */
router.get('/:channel_id/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelUsers;
  req.decodedParams.channel_id = req.params.channel_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.channelUserList,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.users]: responseEntityKey.channelUserList,
        [entityTypeConstants.channelUserRelationMap]: responseEntityKey.channelUserRelations,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.channelListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/List', 'r_a_v1_c_5', null, dataFormatterFunc));
});

module.exports = router;
