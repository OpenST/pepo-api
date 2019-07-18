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

/* Content Feeds*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  // let r = responseHelper.successWithData(require(rootPrefix + '/test/fake/feed.json'));

  //Promise.resolve(responseHelper.renderApiResponse(r, res, {}));

  req.decodedParams.apiName = apiName.publicFeed;
  req.decodedParams.user_id = req.params.user_id;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.feedsEntity,
      entityKindToResponseKeyMap: {
        [entityType.feedList]: responseEntityKey.feedsEntity,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.userStats]: responseEntityKey.userStats,
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

  Promise.resolve(routeHelper.perform(req, res, next, '/feed/Public', 'r_a_v1_f_1', null, dataFormatterFunc));
});

module.exports = router;
