const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Public Feeds*/
router.post('/request-token', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterRequestToken;

  // const dataFormatterFunc = async function(serviceResponse) {
  //   const wrapperFormatterRsp = await new FormatterComposer({
  //     resultType: responseEntityKey.publicFeed,
  //     entityKindToResponseKeyMap: {
  //       [entityType.feedList]: responseEntityKey.publicFeed,
  //       [entityType.ostTransactionMap]: responseEntityKey.ostTransaction,
  //       [entityType.externalEntityGifMap]: responseEntityKey.gifs,
  //       [entityType.usersMap]: responseEntityKey.users,
  //       [entityType.feedListMeta]: responseEntityKey.meta
  //     },
  //     serviceData: serviceResponse.data
  //   }).perform();
  //
  //   serviceResponse.data = wrapperFormatterRsp.data;
  // };

  Promise.resolve(routeHelper.perform(req, res, next, '/oAuth1/twitter/RequestToken', 'r_a_v1_f_1', null, null));
});

module.exports = router;
