const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Search tags */
router.get('/tags', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTags;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.tagSearchResults,
      entityKindToResponseKeyMap: {
        [entityType.tagList]: responseEntityKey.tagSearchResults,
        [entityType.tagListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TagSearch', 'r_a_v1_s_1', null, dataFormatterFunc));
});

/* Search users */
router.get('/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.userSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.userSearchResults,
      entityKindToResponseKeyMap: {
        [entityType.userSearchList]: responseEntityKey.userSearchResults,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/UserSearch', 'r_a_v1_s_2', null, dataFormatterFunc));
});

/* Search users */
router.get('/top', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.mixedTopSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    console.log('Service Response: ', serviceResponse.data[entityType.searchCategoriesList]);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.searchCategoriesResults,
      entityKindToResponseKeyMap: {
        [entityType.searchCategoriesList]: responseEntityKey.searchCategoriesResults,
        [entityType.tagList]: responseEntityKey.tagSearchResults,
        [entityType.userSearchList]: responseEntityKey.userSearchResults,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/TopMixed', 'r_a_v1_s_3', null, dataFormatterFunc));
});

/* Search at-mention users */
router.get('/at-mention', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.atMentionSearch;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.mentionSearchResults,
      entityKindToResponseKeyMap: {
        [entityType.userSearchList]: responseEntityKey.mentionSearchResults,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.userSearchMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/search/UserSearch', 'r_a_v1_s_4', null, dataFormatterFunc));
});

module.exports = router;
