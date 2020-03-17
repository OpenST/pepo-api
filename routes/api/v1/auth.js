const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

/* Logout user*/
router.post('/logout', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.logout;

  const resp = responseHelper.successWithData({});

  return res.status(200).json(resp); // Deliberately returning success response
});

/* Twitter connect. */
router.post('/twitter-login', sanitizer.sanitizeDynamicUrlParams, sanitizer.sanitizeHeaderParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.twitterLogin;

  req.decodedParams.ip_address = req.headers['x-forwarded-for'];
  req.decodedParams.sanitized_headers = req.sanitizedHeaders;

  cookieHelper.fetchUserUtmCookie(req);

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    cookieHelper.deleteUserUtmCookie(res);
    cookieHelper.deleteInviteCodeCookie(res);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.loggedInUser]: responseEntityKey.loggedInUser,
        [entityTypeConstants.airdropDetails]: responseEntityKey.airdropDetails,
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
    routeHelper.perform(req, res, next, '/connect/Twitter', 'r_a_v1_a_2', null, onServiceSuccess, onServiceFailure)
  );
});

/* Github connect. */
router.post('/github-login', sanitizer.sanitizeDynamicUrlParams, sanitizer.sanitizeHeaderParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.githubConnect;

  req.decodedParams.ip_address = req.headers['x-forwarded-for'];
  req.decodedParams.pepo_device_id = req.headers['x-pepo-device-id'];

  cookieHelper.fetchUserUtmCookie(req);

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    cookieHelper.deleteUserUtmCookie(res);
    cookieHelper.deleteInviteCodeCookie(res);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.loggedInUser]: responseEntityKey.loggedInUser,
        [entityTypeConstants.airdropDetails]: responseEntityKey.airdropDetails,
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
    routeHelper.perform(req, res, next, '/connect/Github', 'r_a_v1_a_3', null, onServiceSuccess, onServiceFailure)
  );
});

/* Google connect. */
router.post('/google-login', sanitizer.sanitizeDynamicUrlParams, sanitizer.sanitizeHeaderParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.googleConnect;

  req.decodedParams.ip_address = req.headers['x-forwarded-for'];
  req.decodedParams.sanitized_headers = req.sanitizedHeaders;

  cookieHelper.fetchUserUtmCookie(req);

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    cookieHelper.deleteUserUtmCookie(res);
    cookieHelper.deleteInviteCodeCookie(res);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.loggedInUser]: responseEntityKey.loggedInUser,
        [entityTypeConstants.airdropDetails]: responseEntityKey.airdropDetails,
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
    routeHelper.perform(req, res, next, '/connect/Google', 'r_a_v1_a_4', null, onServiceSuccess, onServiceFailure)
  );
});

/* Apple connect. */
router.post('/apple-login', sanitizer.sanitizeDynamicUrlParams, sanitizer.sanitizeHeaderParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.appleConnect;

  req.decodedParams.ip_address = req.headers['x-forwarded-for'];
  req.decodedParams.pepo_device_id = req.headers['x-pepo-device-id'];

  cookieHelper.fetchUserUtmCookie(req);

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
    cookieHelper.deleteUserUtmCookie(res);
    cookieHelper.deleteInviteCodeCookie(res);
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityTypeConstants.loggedInUser]: responseEntityKey.loggedInUser,
        [entityTypeConstants.airdropDetails]: responseEntityKey.airdropDetails,
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
    routeHelper.perform(req, res, next, '/connect/Apple', 'r_a_v1_a_5', null, onServiceSuccess, onServiceFailure)
  );
});

/* Twitter disconnect. */
router.post('/twitter-disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.twitterDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Twitter', 'r_a_v1_a_6', null));
});

/* Apple disconnect. */
router.post('/apple-disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.appleDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Apple', 'r_a_v1_a_7', null));
});

/* Google disconnect. */
router.post('/google-disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.googleDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Google', 'r_a_v1_a_8', null));
});

/* Github disconnect. */
router.post('/github-disconnect', cookieHelper.parseUserCookieForLogout, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.githubDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/disconnect/Github', 'r_a_v1_a_9', null));
});

module.exports = router;
