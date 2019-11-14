const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

router.post('/', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.initiateReply;

  const dataFormatterFunc = async function(serviceResponse) {
    console.log('=serviceResponse======', JSON.stringify(serviceResponse));
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.videoReplies,
      entityKindToResponseKeyMap: {
        [entityType.videoReplyList]: responseEntityKey.videoReplies
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Initiate', 'r_a_v1_r_1', null, dataFormatterFunc));
});

router.post('/validate-upload', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.validateUploadReply;

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Validate', 'r_a_v1_r_2', null, null));
});

/* Get reply by id */
router.get('/:reply_id', sanitizer.sanitizeDynamicUrlParams, cookieHelper.validateUserLoginRequired, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.getReply;
  req.decodedParams.reply_id = req.params.reply_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.replies,
      entityKindToResponseKeyMap: {
        [entityType.userVideoList]: responseEntityKey.videoReplies,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.userProfilesMap]: responseEntityKey.userProfiles,
        [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.replyDetailsMap]: responseEntityKey.replyDetails,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/GetById', 'r_a_v1_r_3', null, dataFormatterFunc));
});

module.exports = router;
