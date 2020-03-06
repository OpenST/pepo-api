const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Request Token for github */
router.get('/redirect-url', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.githubRedirectUrl;
  req.decodedParams.dev_login = basicHelper.isRequestFromPepoDevEnvAndSupported(req) || false;

  const dataFormatterFunc = async function(serviceResponse) {
    cookieHelper.setLoginRefererCookie(req, res);
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
    routeHelper.perform(req, res, next, '/webConnect/github/GetRedirectUrl', 'r_a_w_a_gh_1', null, dataFormatterFunc)
  );
});

/* Github connect. */
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.githubConnect;
  req.decodedParams.api_source = apiSourceConstants.web;
  req.decodedParams.dev_login = basicHelper.isRequestFromPepoDevEnvAndSupported(req) || false;

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
    routeHelper.perform(
      req,
      res,
      next,
      '/webConnect/github/Verify',
      'r_a_w_a_gh_2',
      null,
      onServiceSuccess,
      onServiceFailure
    )
  );
});

/* Github disconnect. */
router.post('/disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.githubDisconnect;
  req.decodedParams.api_source = apiSourceConstants.web;
  req.decodedParams.dev_login = basicHelper.isRequestFromPepoDevEnvAndSupported(req) || false;

  cookieHelper.deleteWebLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Github', 'r_a_w_a_gh_3', null));
});

module.exports = router;
