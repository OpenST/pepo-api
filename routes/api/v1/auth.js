const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

/* Logout user*/
router.post('/logout', sanitizer.sanitizeDynamicUrlParams, function(req, res) {
  req.decodedParams.apiName = apiName.logout;

  const errorConfig = basicHelper.fetchErrorConfig(req.decodedParams.apiVersion),
    responseObject = responseHelper.successWithData({});

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(responseHelper.renderApiResponse(responseObject, res, errorConfig));
});

/* Twitter Connect*/
router.post('/twitter-login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterLogin;

  const onServiceSuccess = async function(serviceResponse) {
    cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);

    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.loggedInUser]: responseEntityKey.loggedInUser,
        [entityType.usersMap]: responseEntityKey.users
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function() {
    cookieHelper.deleteLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/twitter/Connect', 'r_a_v1_a_3', null, onServiceSuccess, onServiceFailure)
  );
});

/* Twitter Disconnect */
router.post('/twitter-disconnect', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterDisconnect;

  cookieHelper.deleteLoginCookie(res);

  Promise.resolve(routeHelper.perform(req, res, next, '/twitter/Disconnect', 'r_a_v1_a_4', null));
});

module.exports = router;
