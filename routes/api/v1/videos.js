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
        [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityType.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
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

/* Get list of replies given video id. */
router.get('/:video_id/replies', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.replyList;
  req.decodedParams.video_id = req.params.video_id;

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
        [entityType.currentUserReplyDetailContributionsMap]: responseEntityKey.currentUserReplyDetailContributions,
        [entityType.currentUserReplyDetailsRelationsMap]: responseEntityKey.currentUserReplyDetailsRelations,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token,
        [entityType.userVideoListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/List', 'r_a_v1_u_13', null, dataFormatterFunc));
});

/* Get list of replies given video id. */
router.get('/:video_id/unseen-replies', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.unseenReplies;
  req.decodedParams.video_id = req.params.video_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.unseenReplies,
      entityKindToResponseKeyMap: {
        [entityType.unseenReplies]: responseEntityKey.unseenReplies,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/Unseen', 'r_a_v1_u_13', null, dataFormatterFunc));
});

/* Video share */
router.get('/:video_id/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.videoShare;
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

router.post('/:video_id/delete', sanitizer.sanitizeDynamicUrlParams, cookieHelper.validateUserLoginRequired, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.deleteVideo;
  req.decodedParams.video_id = req.params.video_id;

  Promise.resolve(routeHelper.perform(req, res, next, '/video/Delete', 'r_a_v1_v_3', null, null));
});

router.post('/validate-upload', cookieHelper.validateUserLoginRequired, function(req, res, next) {
  req.decodedParams.apiName = apiName.validateUploadVideo;

  Promise.resolve(routeHelper.perform(req, res, next, '/video/Validate', 'r_a_v1_v_5', null, null));
});

/* Merge video segments. */
router.post('/merge-jobs', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.mergeVideoSegments;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.videoMergeJob,
      entityKindToResponseKeyMap: {
        [entityType.videoMergeJob]: responseEntityKey.videoMergeJob
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/video/MergeSegments', 'r_a_v1_v_6', null, dataFormatterFunc));
});

/* Video merge status. */
router.get('/merge-jobs/:video_merge_job_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.videoMergeJobStatus;
  req.decodedParams.video_merge_job_id = req.params.video_merge_job_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.videoMergeJob,
      entityKindToResponseKeyMap: {
        [entityType.videoMergeJob]: responseEntityKey.videoMergeJob
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/video/VideoMergeJobStatus', 'r_a_v1_v_7', null, dataFormatterFunc)
  );
});

module.exports = router;
