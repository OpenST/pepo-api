const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Request token for twitter. */
router.get('/redirect-url', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterRedirectUrl;
  req.decodedParams.state = basicHelper.getAfterLoginRedirectUrl(req);

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.redirectUrl,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.redirectUrl]: responseEntityKey.redirectUrl
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/webConnect/twitter/GetRedirectUrl', 'r_a_w_pl_2', null, dataFormatterFunc)
  );
});

/* Twitter connect. */
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterLogin;

  cookieHelper.fetchUserUtmCookie(req);
  cookieHelper.fetchInviteCodeCookie(req);

  const dataFormatterFunc = async function(serviceResponse) {
    cookieHelper.setWebLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    cookieHelper.deleteUserUtmCookie(res);
    cookieHelper.deleteInviteCodeCookie(res);
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
    routeHelper.perform(
      req,
      res,
      next,
      '/webConnect/twitter/Verify',
      'r_a_w_c_t_1',
      null,
      dataFormatterFunc,
      onServiceFailure
    )
  );
});

/* Twitter disconnect. */
router.post('/disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.twitterDisconnect;

  cookieHelper.deleteWebLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Twitter', 'r_a_w_g_2', null));
});

module.exports = router;
