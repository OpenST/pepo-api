const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

router.get('/:feed_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  let r = responseHelper.successWithData(require(rootPrefix + '/test/fake/feed_details.json'));

  Promise.resolve(responseHelper.renderApiResponse(r, res, {}));
});

router.get('/new/:feed_id', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
        [entityType.tagsMap]: responseEntityKey.tags,
        [entityType.linksMap]: responseEntityKey.links,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.videosMap]: responseEntityKey.videos,
        [entityType.videoDetailsMap]: responseEntityKey.videoDetails,
        [entityType.currentUserUserContributionsMap]: responseEntityKey.currentUserUserContributions,
        [entityType.currentUserVideoContributionsMap]: responseEntityKey.currentUserVideoContributions
      },
      serviceData: serviceResponse.data
    }).perform();

    console.log('wrapperFormatterRsp-----', wrapperFormatterRsp);

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/ById', 'r_a_v1_f_1', null, dataFormatterFunc));
});

/* Content Feeds*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userFeed;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.feedsList,
      entityKindToResponseKeyMap: {
        [entityType.feedList]: responseEntityKey.feedsList,
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
        [entityType.feedListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    console.log('wrapperFormatterRsp-----', wrapperFormatterRsp);

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/Public', 'r_a_v1_f_2', null, dataFormatterFunc));
});

module.exports = router;
