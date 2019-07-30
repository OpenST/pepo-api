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

/* Public Activities*/
router.get('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.publicActivity;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.publicActivity,
      entityKindToResponseKeyMap: {
        [entityType.activityList]: responseEntityKey.publicActivity,
        [entityType.ostTransactionMap]: responseEntityKey.ostTransaction,
        [entityType.externalEntityGifMap]: responseEntityKey.gifs,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.imagesMap]: responseEntityKey.images,
        [entityType.activityListMeta]: responseEntityKey.meta
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/activity/Public', 'r_a_v1_a_1', null, dataFormatterFunc));
});

module.exports = router;
