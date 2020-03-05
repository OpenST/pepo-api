const express = require('express'),
  cookieParser = require('cookie-parser'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer');

/* Get url and message for sharing channel given its permalink. */
router.get('/:channel_permalink/share', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.channelShare;
  req.decodedParams.channel_permalink = req.params.channel_permalink;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.share,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.share]: responseEntityKey.share
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/channel/ShareDetails', 'r_a_w_1', null, dataFormatterFunc));
});

module.exports = router;
