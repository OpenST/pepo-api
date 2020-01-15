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

/* Single user feeds*/
router.get('/:feed_id', cookieHelper.validateUserLoginRequired, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.feedDetails;
  req.decodedParams.feed_id = req.params.feed_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.feed,
      entityKindToResponseKeyMap: {
        [entityType.feed]: responseEntityKey.feed,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.userProfilesMap]: responseEntityKey.userProfiles,
        [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/ById', 'r_a_v1_f_1', null, dataFormatterFunc));
});

/* Public Feeds*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, sanitizer.sanitizeHeaderParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.feedsList;
  req.decodedParams.sanitized_headers = req.sanitizedHeaders;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.feedsList,
      entityKindToResponseKeyMap: {
        [entityType.feedList]: responseEntityKey.feedsList,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
        [entityType.userProfilesMap]: responseEntityKey.userProfiles,
        [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.userProfileAllowedActions]: responseEntityKey.userProfileAllowedActions,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityType.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityType.feedListMeta]: responseEntityKey.meta,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/Public', 'r_a_v1_f_2', null, dataFormatterFunc));
});

/* Public Feeds*/
router.get(
  '/for-you',
  cookieHelper.validateUserLoginRequired,
  sanitizer.sanitizeDynamicUrlParams,
  sanitizer.sanitizeHeaderParams,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.forYouFeedsList;
    req.decodedParams.sanitized_headers = req.sanitizedHeaders;

    const dataFormatterFunc = async function(serviceResponse) {
      const wrapperFormatterRsp = await new FormatterComposer({
        resultType: responseEntityKey.feedsList,
        entityKindToResponseKeyMap: {
          [entityType.usersMap]: responseEntityKey.users,
          [entityType.userStats]: responseEntityKey.userStats,
          [entityType.userProfilesMap]: responseEntityKey.userProfiles,
          [entityType.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
          [entityType.tagsMap]: responseEntityKey.tags,
          [entityType.linksMap]: responseEntityKey.links,
          [entityType.imagesMap]: responseEntityKey.images,
          [entityType.videosMap]: responseEntityKey.videos,
          [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
          [entityType.userProfileAllowedActions]: responseEntityKey.userProfileAllowedActions,
          [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
          [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
          [entityType.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
          [entityType.feedListMeta]: responseEntityKey.meta,
          [entityType.pricePointsMap]: responseEntityKey.pricePoints,
          [entityType.token]: responseEntityKey.token
        },
        serviceData: serviceResponse.data
      }).perform();

      serviceResponse.data = wrapperFormatterRsp.data;
    };

    Promise.resolve(routeHelper.perform(req, res, next, '/feed/ForYou', 'r_a_v1_f_3', null, dataFormatterFunc));
  }
);

module.exports = router;
