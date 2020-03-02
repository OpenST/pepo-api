const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/* Logout user. */
router.post('/logout', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.logout;

  const resp = responseHelper.successWithData({});

  return res.status(200).json(resp); // Deliberately returning success response.
});

/* Github connect. */
router.post('/github-login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.githubConnect;

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
    routeHelper.perform(req, res, next, '/connect/Github', 'r_a_w_a_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Github disconnect. */
router.post('/github-disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.githubDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Github', 'r_a_w_a_2', null));
});

module.exports = router;
