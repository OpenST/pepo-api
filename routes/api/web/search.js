const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Search channels. */
router.get('/channels', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getChannels;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.channelSearchResults,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.channelSearchList]: responseEntityKey.channelSearchResults,
        [entityTypeConstants.channelsMap]: responseEntityKey.channels,
        [entityTypeConstants.channelDetailsMap]: responseEntityKey.channelDetails,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats,
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.textsMap]: responseEntityKey.texts,
        [entityTypeConstants.channelListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/ChannelSearch', 'r_a_w_s_1', null, dataFormatterFunc));
});

module.exports = router;
