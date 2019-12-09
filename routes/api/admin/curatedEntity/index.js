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

/* Insert or update curated entity */
router.post('/update', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.updateCuratedEntity;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/Update', 'r_a_v1_ce_i_1', null, null, null));
});

/* delete curated entity */
router.post('/delete', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.deleteCuratedEntity;

  Promise.resolve(routeHelper.perform(req, res, next, '/admin/curated/Delete', 'r_a_v1_ce_i_2', null, null, null));
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

module.exports = router;
