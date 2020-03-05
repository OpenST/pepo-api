const express = require('express'),
  router = express.Router();

const rootPrefix = '../../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Request Token for twitter */
router.get('/request-token', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterRequestToken;
  req.decodedParams.api_source = apiSourceConstants.web;

  const dataFormatterFunc = async function(serviceResponse) {
    cookieHelper.setLoginRefererCookie(req, res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/webConnect/twitter/GetRequestToken', 'r_a_w_pl_2', null, dataFormatterFunc)
  );
});

/* Twitter connect. */
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterLogin;
  req.decodedParams.api_source = apiSourceConstants.web;

  cookieHelper.fetchUserUtmCookie(req);

  const dataFormatterFunc = async function(serviceResponse) {
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
  req.decodedParams.api_source = apiSourceConstants.web;

  cookieHelper.deleteWebLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Twitter', 'r_a_w_g_2', null));
});

module.exports = router;
