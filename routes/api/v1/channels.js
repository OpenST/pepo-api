const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Get channel details. */
router.get('/:channel_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getChannelDetails;
  req.decodedParams.channel_id = req.params.channel_id;

  // const dataFormatterFunc = async function(serviceResponse) {
  //   const wrapperFormatterRsp = await new FormatterComposer({
  //     resultType: responseEntityKey.tag,
  //     entityKindToResponseKeyMap: {
  //       [entityTypeConstants.tag]: responseEntityKey.tag
  //     },
  //     serviceData: serviceResponse.data
  //   }).perform();
  //
  //   serviceResponse.data = wrapperFormatterRsp.data;
  // };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/Get', 'r_a_v1_c_1', null, null));
});

/* Join channel by user. */
router.get('/:channel_id/join', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.joinChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Join', 'r_a_v1_c_2', null, null));
});

/* Leave channel by user. */
router.get('/:channel_id/leave', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.leaveChannel;
  req.decodedParams.channel_id = req.params.channel_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/Leave', 'r_a_v1_c_3', null, null));
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
        [entityTypeConstants.userStats]: responseEntityKey.userStats,
        [entityTypeConstants.userProfilesMap]: responseEntityKey.userProfiles,
        [entityTypeConstants.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.videosMap]: responseEntityKey.videos,
        [entityTypeConstants.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityTypeConstants.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityTypeConstants.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityTypeConstants.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints,
        [entityTypeConstants.token]: responseEntityKey.token,
        [entityTypeConstants.tagVideoListMeta]: responseEntityKey.meta
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
        [entityTypeConstants.usersMap]: responseEntityKey.channelUserList,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.userListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/user/List', 'r_a_v1_c_5', null, dataFormatterFunc));
});

/* Get url and message for sharing channel given its channel id. */
router.get('/:channel_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelShare;
  req.decodedParams.channel_id = req.params.channel_id;

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

/* Search channels. */
router.get('/search', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getChannels;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.channelSearchResults,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.channelList]: responseEntityKey.channelSearchResults,
        [entityTypeConstants.channelListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/Search', 'r_a_v1_c_7', null, dataFormatterFunc));
});

module.exports = router;
