const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Video history */
router.get('/:video_id', sanitizer.sanitizeDynamicUrlParams, cookieHelper.validateUserLoginRequired, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.getVideo;
  req.decodedParams.video_id = req.params.video_id;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/video/GetById', 'r_a_v1_v_1', null, dataFormatterFunc));
});

/* Video share */
router.get('/:video_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.share;
  req.decodedParams.video_id = req.params.video_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.share,
      entityKindToResponseKeyMap: {
        [entityType.share]: responseEntityKey.share
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/video/ShareDetails', 'r_a_v1_v_2', null, dataFormatterFunc));
});

router.post('/:video_id/delete', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  let r = { success: true, data: {} };

  return res.status(200).json(r);
});

router.post('/:video_id/report', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  let r = { success: true, data: {} };

  return res.status(200).json(r);
});

module.exports = router;
