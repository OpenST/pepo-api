const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  apiRefererConstants = require(rootPrefix + '/lib/globalConstant/apiReferers'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Apple connect. */
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.googleConnect;
  req.decodedParams.api_referer = apiRefererConstants.webReferer;

  cookieHelper.fetchUserUtmCookie(req);

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setWebLoginCookie(res, serviceResponse.data.userLoginCookieValue);
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
    cookieHelper.deleteWebLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/connect/Google', 'r_a_w_go_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Github disconnect. */
router.post('/disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.googleDisconnect;
  req.decodedParams.api_referer = apiRefererConstants.webReferer;

  cookieHelper.deleteWebLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Google', 'r_a_w_go_2', null));
});

module.exports = router;
