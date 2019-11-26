const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

//todo-replies: use at top cookieHelper.validateUserLoginRequired, sanitizer.sanitizeDynamicUrlParams

// Initiate reply on particular video.
router.post('/', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.initiateReply;

  const dataFormatterFunc = async function(serviceResponse) {
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

// Validate initiate reply api parameters.
router.post('/validate-upload', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.validateUploadReply;

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Validate', 'r_a_v1_r_2', null, null));
});

//todo-replies: is reply_id -> reply_detail_id
// Get any particular reply given its reply detail id.
router.get('/:reply_id', sanitizer.sanitizeDynamicUrlParams, cookieHelper.validateUserLoginRequired, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.getReply;
  req.decodedParams.reply_id = req.params.reply_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.videoReplies,
      entityKindToResponseKeyMap: {
        [entityType.videoReplyList]: responseEntityKey.videoReplies,
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
        [entityType.currentUserReplyDetailsRelationsMap]: responseEntityKey.currentUserReplyDetailsRelations,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/GetById', 'r_a_v1_r_3', null, dataFormatterFunc));
});

// Get url and message for sharing reply video given its reply detail id.
router.get('/:reply_detail_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.replyShare;
  req.decodedParams.reply_detail_id = req.params.reply_detail_id;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/ShareDetails', 'r_a_v1_r_4', null, dataFormatterFunc));
});

// Delete reply video given its reply detail id.
router.post('/:reply_details_id/delete', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.deleteReplyVideo;
  req.decodedParams.reply_details_id = req.params.reply_details_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Delete', 'r_a_v1_r_4', null, null));
});

module.exports = router;
