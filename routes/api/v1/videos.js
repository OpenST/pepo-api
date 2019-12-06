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
    // const wrapperFormatterRsp = await new FormatterComposer({
    //   resultType: responseEntityKey.videoReplies,
    //   entityKindToResponseKeyMap: {
    //     [entityType.videoReplyList]: responseEntityKey.videoReplies,
    //     [entityType.usersMap]: responseEntityKey.users,
    //     [entityType.userStats]: responseEntityKey.userStats,
    //     [entityType.userProfilesMap]: responseEntityKey.userProfiles,
    //     [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
    //     [entityType.tagsMap]: responseEntityKey.tags,
    //     [entityType.linksMap]: responseEntityKey.links,
    //     [entityType.imagesMap]: responseEntityKey.images,
    //     [entityType.videosMap]: responseEntityKey.videos,
    //     [entityType.replyDetailsMap]: responseEntityKey.replyDetails,
    //     [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
    //     [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
    //     [entityType.currentUserReplyDetailContributionsMap]: responseEntityKey.currentUserReplyDetailContributions,
    //     [entityType.currentUserReplyDetailsRelationsMap]: responseEntityKey.currentUserReplyDetailsRelations,
    //     [entityType.pricePointsMap]: responseEntityKey.pricePoints,
    //     [entityType.token]: responseEntityKey.token,
    //     [entityType.userVideoListMeta]: responseEntityKey.meta
    //   },
    //   serviceData: serviceResponse.data
    // }).perform();

    serviceResponse.data = {
      users: {
        '2155': {
          id: 2155,
          user_name: 'Yogesh_android',
          name: 'Yogesh_ANDROID',
          status: 'ACTIVE',
          approved_creator: 1,
          uts: 1574833667,
          ost_user_id: 'ccac9617-40f1-4b94-8347-a4221f25b030',
          ost_token_holder_address: '0x407a72eecdea2686dfb96af41ca22455630dd12b',
          ost_status: 'ACTIVATED',
          profile_image_id: '5450'
        },
        '2156': {
          id: 2156,
          user_name: 'yogesh_iOS',
          name: 'Yogesh_iOS',
          status: 'ACTIVE',
          approved_creator: 1,
          uts: 1574833657,
          ost_user_id: 'd032aced-4958-448e-b8b8-08afaa4d7d7b',
          ost_token_holder_address: '0xd184a2496c20500582e42c212cea8476017f3945',
          ost_status: 'ACTIVATED',
          profile_image_id: '5297'
        },
        '2158': {
          id: 2158,
          user_name: 'Wint_k3fpqcbct2',
          name: 'Winner',
          status: 'ACTIVE',
          approved_creator: 0,
          uts: 1574936992,
          ost_user_id: 'd1d756e9-ad9a-481d-8296-5f2906368bf7',
          ost_token_holder_address: '0x7b0066bc118e14fa227ba70ad8f7136a56858ad4',
          ost_status: 'ACTIVATED',
          profile_image_id: '5320'
        }
      },
      images: {
        '5297': {
          id: 5297,
          resolutions: {
            '144w': {
              size: 3798,
              height: '144',
              width: '144',
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/2156-5830d4e58b7b00fb058c8fb0f750b9c3-144w.jpg'
            },
            original: {
              size: 9338,
              height: 480,
              width: 480,
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/2156-5830d4e58b7b00fb058c8fb0f750b9c3-original.jpg'
            }
          },
          status: 'ACTIVE',
          uts: 1574762024
        },
        '5320': {
          id: 5320,
          resolutions: {
            '144w': {
              size: 3260,
              height: '144',
              width: '144',
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/2158-1de356f4fdc583142b7da6a65ae216b8-144w.png'
            },
            original: {
              size: 21541,
              height: 480,
              width: 480,
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/2158-1de356f4fdc583142b7da6a65ae216b8-original.png'
            }
          },
          status: 'ACTIVE',
          uts: 1574764000
        },
        '5450': {
          id: 5450,
          resolutions: {
            '144w': {
              size: 4062,
              height: '144',
              width: '144',
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/2155-f791e4805dd4a2ca44f0cd8ca48130f9-144w.jpg'
            },
            original: {
              size: 25474,
              height: 480,
              width: 480,
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/2155-f791e4805dd4a2ca44f0cd8ca48130f9-original.jpg'
            }
          },
          status: 'ACTIVE',
          uts: 1574777399
        }
      },
      result_type: 'unseen_replies',
      unseen_replies: {
        '1234': {
          id: 1234,
          uts: 12345,
          unseen: [
            {
              reply_detail_id: '1110',
              user_id: '2155'
            },
            {
              reply_detail_id: '1134',
              user_id: '2156'
            },
            {
              reply_detail_id: '1136',
              user_id: '2158'
            },
            {
              reply_detail_id: '1140',
              user_id: '2158'
            }
          ]
        }
      }
    };
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/reply/List', 'r_a_v1_u_13', null, dataFormatterFunc));
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

module.exports = router;
