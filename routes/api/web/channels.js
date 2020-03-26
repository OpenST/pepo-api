const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  headerHelper = require(rootPrefix + '/helpers/header'),
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
        [entityTypeConstants.channelAllowedActionsMap]: responseEntityKey.channelAllowedActions,
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

/* Get channel meeting details. */
router.get(
  '/:channel_permalink/meetings/:meeting_id',
  sanitizer.sanitizeDynamicUrlParams,
  sanitizer.sanitizeHeaderParams,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.getChannelMeeting;
    req.decodedParams.channel_permalink = req.params.channel_permalink;
    req.decodedParams.meeting_id = req.params.meeting_id;

    const dataFormatterFunc = async function(serviceResponse) {
      const wrapperFormatterRsp = await new FormatterComposer({
        resultType: responseEntityKey.meeting,
        entityKindToResponseKeyMap: {
          [entityTypeConstants.meeting]: responseEntityKey.meeting,
          [entityTypeConstants.channelsMap]: responseEntityKey.channels,
          [entityTypeConstants.usersMap]: responseEntityKey.users,
          [entityTypeConstants.imagesMap]: responseEntityKey.images
        },
        serviceData: serviceResponse.data
      }).perform();

      serviceResponse.data = wrapperFormatterRsp.data;
    };

    Promise.resolve(routeHelper.perform(req, res, next, '/channel/meeting/Get', 'r_a_w_c_4', null, dataFormatterFunc));
  }
);

/* Get join channel meeting payload. */
router.get(
  '/:channel_permalink/meetings/:meeting_id/join-payload',
  sanitizer.sanitizeDynamicUrlParams,
  sanitizer.sanitizeHeaderParams,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.getJoinMeetingPayload;
    req.decodedParams.channel_permalink = req.params.channel_permalink;
    req.decodedParams.meeting_id = req.params.meeting_id;
    req.decodedParams.fingerprint_id = headerHelper.fingerprintId(req.sanitizedHeaders);

    const dataFormatterFunc = async function(serviceResponse) {
      const wrapperFormatterRsp = await new FormatterComposer({
        resultType: responseEntityKey.joinZoomMeetingPayload,
        entityKindToResponseKeyMap: {
          [entityTypeConstants.joinZoomMeetingPayload]: responseEntityKey.joinZoomMeetingPayload
        },
        serviceData: serviceResponse.data
      }).perform();

      serviceResponse.data = wrapperFormatterRsp.data;
    };

    Promise.resolve(
      routeHelper.perform(req, res, next, '/channel/meeting/GetJoinPayload', 'r_a_w_c_5', null, dataFormatterFunc)
    );
  }
);

// NOTE: Login mandatory for following routes.
router.use(cookieHelper.validateUserWebLoginCookieRequired);

/* Start channel meeting. */
router.post('/:channel_permalink/meetings', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.startChannelZoomMeeting;
  req.decodedParams.channel_permalink = req.params.channel_permalink;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.startZoomMeetingPayload,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.startZoomMeetingPayload]: responseEntityKey.startZoomMeetingPayload
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/meeting/Create', 'r_a_w_c_6', null, dataFormatterFunc));
});

module.exports = router;
