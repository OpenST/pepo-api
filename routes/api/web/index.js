const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  authRoutes = require(rootPrefix + '/routes/api/web/auth'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  supportRoutes = require(rootPrefix + '/routes/api/web/support'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.WEB_COOKIE_SECRET));

// NOTE: CSRF COOKIE SHOULD NOT BE SET HERE. IT SHOULD ONLY BE SET AT WEB. DO NOT UNCOMMENT-AMAN
// router.use(cookieHelper.setWebCsrf());

router.use('/support', supportRoutes);

router.use('/auth', authRoutes);

/* Get url and message for sharing channel given its permalink. */
router.get('/communities/:channel_permalink/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/ShareDetails', 'r_a_w_1', null, dataFormatterFunc));
});

/* Get url and message for profile given username. */
router.get('/users/:username/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.profileShare;
  req.decodedParams.username = req.params.username;

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

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/profile/ShareDetails', 'r_a_w_2', null, dataFormatterFunc)
  );
});

// Report.
router.post('/report', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.reportIssue;

  Promise.resolve(routeHelper.perform(req, res, next, '/miscellaneous/Report', 'r_a_w_r_1', null, null));
});

/* Video By Id */
router.get('/videos/:video_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getVideo;
  req.decodedParams.video_id = req.params.video_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userVideoList,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.userVideoList]: responseEntityKey.userVideoList,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.userStats]: responseEntityKey.userStats,
        [entityTypeConstants.userProfilesMap]: responseEntityKey.userProfiles,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.videosMap]: responseEntityKey.videos,
        [entityTypeConstants.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityTypeConstants.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityTypeConstants.channelsMap]: responseEntityKey.channels,
        [entityTypeConstants.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityTypeConstants.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityTypeConstants.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints,
        [entityTypeConstants.token]: responseEntityKey.token,
        [entityTypeConstants.userVideoListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/video/GetById', 'r_a_w_v_1', null, dataFormatterFunc));
});

/* Video share. */
router.get('/videos/:video_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.videoShare;
  req.decodedParams.video_id = req.params.video_id;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/video/ShareDetails', 'r_w_v1_v_2', null, dataFormatterFunc));
});

module.exports = router;
