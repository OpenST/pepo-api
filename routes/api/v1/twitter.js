const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

router.post(
  '/refresh-token',
  cookieHelper.validateUserLoginCookieIfPresent,
  cookieHelper.validateUserLoginRequired,
  sanitizer.sanitizeDynamicUrlParams,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.refreshTwitterConnect;

    Promise.resolve(routeHelper.perform(req, res, next, '/twitter/RefreshConnect', 'r_a_v1_a_5', null));
  }
);

/* Fetch twitter info for tweet */
router.get('/tweet-info', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.tweetInfo;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.loggedInUser]: responseEntityKey.loggedInUser,
        [entityType.pricePointsMap]: responseEntityKey.pricePoints,
        [entityType.usersMap]: responseEntityKey.users,
        [entityType.token]: responseEntityKey.token,
        [entityType.secureTwitterUsersMap]: responseEntityKey.secureTwitterUsers
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/twitter/TweetInfo', 'r_a_v1_u_17', null, dataFormatterFunc));
});

module.exports = router;
