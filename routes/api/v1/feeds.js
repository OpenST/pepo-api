const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
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
        [entityTypeConstants.feed]: responseEntityKey.feed,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.userStats]: responseEntityKey.userStats,
        [entityTypeConstants.userProfilesMap]: responseEntityKey.userProfiles,
        [entityTypeConstants.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.videosMap]: responseEntityKey.videos,
        [entityTypeConstants.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityTypeConstants.channelsMap]: responseEntityKey.channels,
        [entityTypeConstants.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityTypeConstants.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityTypeConstants.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions
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
        [entityTypeConstants.feedList]: responseEntityKey.feedsList,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.userStats]: responseEntityKey.userStats,
        [entityTypeConstants.userProfilesMap]: responseEntityKey.userProfiles,
        [entityTypeConstants.videoDescriptionsMap]: responseEntityKey.videoDescriptions,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.videosMap]: responseEntityKey.videos,
        [entityTypeConstants.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityTypeConstants.channelsMap]: responseEntityKey.channels,
        [entityTypeConstants.userProfileAllowedActions]: responseEntityKey.userProfileAllowedActions,
        [entityTypeConstants.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityTypeConstants.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions,
        [entityTypeConstants.currentUserVideoRelationsMap]: responseEntityKey.currentUserVideoRelations,
        [entityTypeConstants.feedListMeta]: responseEntityKey.meta,
        [entityTypeConstants.pricePointsMap]: responseEntityKey.pricePoints,
        [entityTypeConstants.token]: responseEntityKey.token
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/Public', 'r_a_v1_f_2', null, dataFormatterFunc));
});

module.exports = router;
