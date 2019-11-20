const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  AdminFormatterComposer = require(rootPrefix + '/lib/formatter/AdminComposer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  adminResponseEntityKey = require(rootPrefix + '/lib/globalConstant/adminResponseEntity');

/* Insert curated entity */
router.post('/insert', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.insertCuratedEntity;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/Insert', 'r_a_v1_ce_i_1', null, null, null));
});

/* Reorder curated entity */
router.post('/reorder', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.reorderCuratedEntity;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/Reorder', 'r_a_v1_ce_i_2', null, null, null));
});

/* Get list for given user entity kind */
router.get('/users', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getUsersCuratedEntityList;
  req.decodedParams.entity_kind = curatedEntitiesConstants.userEntityKind;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.usersCuratedList,
      entityKindToResponseKeyMap: {
        [adminEntityType.usersCuratedEntitiesList]: adminResponseEntityKey.usersCuratedList,
        [adminEntityType.adminUsersMap]: adminResponseEntityKey.users
      },
      serviceData: serviceResponse.data
    }).perform();
    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/List', 'r_a_v1_ce_i_3', null, dataFormatterFunc));
});

/* Get list for given tag entity kind */
router.get('/tags', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.getTagsCuratedEntityList;
  req.decodedParams.entity_kind = curatedEntitiesConstants.tagsEntityKind;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new AdminFormatterComposer({
      resultType: adminResponseEntityKey.tagsCuratedList,
      entityKindToResponseKeyMap: {
        [adminEntityType.tagsCuratedEntitiesList]: adminResponseEntityKey.tagsCuratedList,
        [adminEntityType.tagsMap]: adminResponseEntityKey.tags
      },
      serviceData: serviceResponse.data
    }).perform();
    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/List', 'r_a_v1_ce_i_4', null, dataFormatterFunc));
});

/* Reorder curated entity */
router.post('/delete', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.deleteCuratedEntity;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/Delete', 'r_a_v1_ce_i_5', null, null, null));
});

module.exports = router;
