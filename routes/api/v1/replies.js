const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

// Get url and message for sharing reply video given its reply detail id.
router.get('/:reply_detail_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.replyShare;
  req.decodedParams.reply_detail_id = req.params.reply_detail_id;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/ShareDetails', 'r_a_v1_r_4', null, dataFormatterFunc));
});

// User should be logged in to access all the further routes.
router.use(cookieHelper.validateUserLoginRequired);

// Initiate reply on particular video.
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.initiateReply;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.videoReplies,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.videoReplyList]: responseEntityKey.videoReplies
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Initiate', 'r_a_v1_r_1', null, dataFormatterFunc));
});

// Validate initiate reply api parameters.
router.post('/validate-upload', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.validateUploadReply;

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Validate', 'r_a_v1_r_2', null, null));
});

// Get any particular reply given its reply detail id.
router.get('/:reply_detail_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getReply;
  req.decodedParams.reply_detail_id = req.params.reply_detail_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.videoReplies,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.videoReplyList]: responseEntityKey.videoReplies,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.userStats]: responseEntityKey.userStats,
        [entityTypeConstants.userProfilesMap]: responseEntityKey.userProfiles,
        [entityTypeConstants.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.videosMap]: responseEntityKey.videos,
        [entityTypeConstants.replyDetailsMap]: responseEntityKey.replyDetails,
        [entityTypeConstants.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityTypeConstants.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityTypeConstants.currentUserReplyDetailContributionsMap]:
          responseEntityKey.currentUserReplyDetailContributions,
        [entityTypeConstants.currentUserReplyDetailsRelationsMap]: responseEntityKey.currentUserReplyDetailsRelations,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints,
        [entityTypeConstants.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/GetById', 'r_a_v1_r_3', null, dataFormatterFunc));
});

// Delete reply video given its reply detail id.
router.post('/:reply_details_id/delete', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.deleteReplyVideo;
  req.decodedParams.reply_details_id = req.params.reply_details_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Delete', 'r_a_v1_r_4', null, null));
});

module.exports = router;
