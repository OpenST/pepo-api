const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Twitter connect. */
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterLogin;

  cookieHelper.fetchUserUtmCookie(req);

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    cookieHelper.deleteUserUtmCookie(res);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.loggedInUser]: responseEntityKey.loggedInUser,
        [entityTypeConstants.usersMap]: responseEntityKey.users,
        [entityTypeConstants.imagesMap]: responseEntityKey.images,
        [entityTypeConstants.utmParams]: responseEntityKey.utmParams,
        [entityTypeConstants.twitterConnectMeta]: responseEntityKey.meta,
        [entityTypeConstants.goto]: responseEntityKey.goto
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function() {
    cookieHelper.deleteLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/connect/Twitter', 'r_a_w_g_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Twitter disconnect. */
router.post('/disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.twitterDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Twitter', 'r_a_w_g_2', null));
});

/* Request Token for twitter */
router.get('/request_token', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterRequestToken;

  const onServiceSuccess = async function(serviceResponse) {
    // if (serviceResponse.data.dataCookieValue) {
    //   cookieHelper.setPreLaunchDataCookie(res, serviceResponse.data.dataCookieValue);
    // }
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/connect/GetTwitterRequestToken', 'r_a_w_pl_2', null, onServiceSuccess)
  );
});

module.exports = router;
