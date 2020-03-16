const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Get url and message for sharing channel given its permalink. */
router.get('/:channel_permalink/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelShare;
  req.decodedParams.channel_permalink = req.params.channel_permalink;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/ShareDetails', 'r_a_w_c_1', null, dataFormatterFunc));
});

/* Get channel details. */
router.get('/:channel_permalink', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getChannelDetails;
  req.decodedParams.channel_permalink = req.params.channel_permalink;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/Get', 'r_a_w_c_2', null, dataFormatterFunc));
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

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/GetVideoList', 'r_a_w_c_3', null, dataFormatterFunc));
});

module.exports = router;
