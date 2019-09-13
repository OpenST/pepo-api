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

/* Logout user*/
router.post('/logout', cookieHelper.validateUserCookieWithoutError, sanitizer.sanitizeDynamicUrlParams, function(
  req,
  res,
  next
) {
  req.decodedParams.apiName = apiName.logout;

  Promise.resolve(routeHelper.perform(req, res, next, '/Logout', 'r_a_v1_a_2', null));
});

/* Twitter Connect*/
router.post('/twitter-login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.twitterLogin;

  const onServiceSuccess = async function(serviceResponse) {
    let formatterParams = {};
    if (serviceResponse.data.overwrittenFailure) {
      formatterParams = {
        resultType: responseEntityKey.goto,
        entityKindToResponseKeyMap: {
          [entityType.goto]: responseEntityKey.goto
        },
        serviceData: serviceResponse.data
      };
    } else {
      cookieHelper.setLoginCookie(res, serviceResponse.data.userLoginCookieValue);
      formatterParams = {
        resultType: responseEntityKey.loggedInUser,
        entityKindToResponseKeyMap: {
          [entityType.loggedInUser]: responseEntityKey.loggedInUser,
          [entityType.usersMap]: responseEntityKey.users
        },
        serviceData: serviceResponse.data
      };
    }
    const wrapperFormatterRsp = await new FormatterComposer(formatterParams).perform();

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
router.post(
  '/twitter-disconnect',
  cookieHelper.validateUserLoginCookieIfPresent,
  cookieHelper.validateUserLoginRequired,
  sanitizer.sanitizeDynamicUrlParams,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.twitterDisconnect;

    cookieHelper.deleteLoginCookie(res);

    Promise.resolve(routeHelper.perform(req, res, next, '/twitter/Disconnect', 'r_a_v1_a_4', null));
  }
);

router.post('/refresh-twitter-connect', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.refreshTwitterConnect;

  Promise.resolve(routeHelper.perform(req, res, next, '/twitter/RefreshConnect', 'r_a_v1_a_5', null));
});

module.exports = router;
