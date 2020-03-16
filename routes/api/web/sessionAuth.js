const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Post session auth payload. */
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.postSessionAuth;

  const dataFormatterFunc = async function(serviceResponse) {
    const deepLinkUrl = serviceResponse.data.deepLinkUrl,
      pushNotificationEnabled = serviceResponse.data.pushNotificationEnabled;

    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.sessionAuthPayload,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.sessionAuthPayload]: responseEntityKey.sessionAuthPayload
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
    serviceResponse.data.deepLinkUrl = deepLinkUrl;
    serviceResponse.data.pushNotificationEnabled = pushNotificationEnabled;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/sessionAuth/Post', 'r_a_w_sa_1', null, dataFormatterFunc));
});

module.exports = router;
