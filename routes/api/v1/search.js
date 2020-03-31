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

/* Search channels. */
router.get('/channels/new', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getNewChannels;

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

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/list/New', 'r_a_v1_s_7', null, dataFormatterFunc));
});

router.use(cookieHelper.validateUserLoginRequired);

/* Search tags */
router.get('/tags', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTags;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.tagSearchResults,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.tagList]: responseEntityKey.tagSearchResults,
        [entityTypeConstants.tagListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TagSearch', 'r_a_v1_s_1', null, dataFormatterFunc));
});

/* Search tags mention */
router.get('/tags-mention', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTags;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.tagSearchResults,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.tagList]: responseEntityKey.tagSearchResults,
        [entityTypeConstants.tagListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TagSearch', 'r_a_v1_s_2', null, dataFormatterFunc));
});

/* Search users */
router.get('/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userSearchResults,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.userSearchList]: responseEntityKey.userSearchResults,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/UserSearch', 'r_a_v1_s_3', null, dataFormatterFunc));
});

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

  Promise.resolve(routeHelper.perform(req, res, next, '/search/ChannelSearch', 'r_a_v1_c_4', null, dataFormatterFunc));
});

/* Search user mention */
router.get('/users-mention', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.atMentionSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userSearchResults,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.users]: responseEntityKey.userSearchResults,
        //[entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.userListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/search/AtMentionSearch', 'r_a_v1_s_5', null, dataFormatterFunc)
  );
});

/* Search users */
router.get('/top', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.mixedTopSearch;

  // Note: Here the if condition is needed because channel search is not supported for old builds.
  const dataFormatterFunc = async function(serviceResponse) {
    const entityResponseMap = {
      [entityTypeConstants.searchCategoriesList]: responseEntityKey.searchCategoriesResults,
      [entityTypeConstants.tagList]: responseEntityKey.tagSearchResults,
      [entityTypeConstants.userSearchList]: responseEntityKey.userSearchResults,
      [entityTypeConstants.usersMap]: responseEntityKey.users,
      [entityTypeConstants.imagesMap]: responseEntityKey.images,
      [entityTypeConstants.userSearchMeta]: responseEntityKey.meta
    };
    if (serviceResponse.data.meta.supportedEntities.indexOf('channel') > -1) {
      Object.assign(entityResponseMap, {
        [entityTypeConstants.channelSearchList]: responseEntityKey.channelSearchResults,
        [entityTypeConstants.channelsMap]: responseEntityKey.channels,
        [entityTypeConstants.channelDetailsMap]: responseEntityKey.channelDetails,
        [entityTypeConstants.channelStatsMap]: responseEntityKey.channelStats,
        [entityTypeConstants.currentUserChannelRelationsMap]: responseEntityKey.currentUserChannelRelations,
        [entityTypeConstants.tagsMap]: responseEntityKey.tags,
        [entityTypeConstants.linksMap]: responseEntityKey.links,
        [entityTypeConstants.textsMap]: responseEntityKey.texts
      });
    }
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.searchCategoriesResults,
      entityKindToResponseKeyMap: entityResponseMap,
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TopMixed', 'r_a_v1_s_6', null, dataFormatterFunc));
});

module.exports = router;
