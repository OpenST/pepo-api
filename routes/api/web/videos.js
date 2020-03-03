const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.COOKIE_SECRET));

/* Video By Id */
router.get('/:video_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
router.get('/:video_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
