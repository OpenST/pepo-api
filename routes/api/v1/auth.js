const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

/* Create user*/
router.post('/sign-up', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.signUp;

  const onServiceSuccess = async function(serviceResponse) {
    setLoginCookies(res, serviceResponse.data.userLoginCookieValue);

    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.user]: responseEntityKey.loggedInUser
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    deleteLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/SignUp', 'r_a_v1_a_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Login user*/
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.login;

  const onServiceSuccess = async function(serviceResponse) {
    setLoginCookies(res, serviceResponse.data.userLoginCookieValue);
    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: responseEntityKey.loggedInUser,
      entityKindToResponseKeyMap: {
        [entityType.user]: responseEntityKey.loggedInUser
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    deleteLoginCookie(res);
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/Login', 'r_a_v1_a_2', null, onServiceSuccess, onServiceFailure)
  );
});

/**
 * Method to set login cookies
 *
 * @param responseObject
 * @param cookieValue
 */
function setLoginCookies(responseObject, cookieValue) {
  //TODO: Cookie Security Review. Duplicate settings.
  //TODO: Read: https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely
  //TODO: Domain not defined.
  //TODO: path / not defined.
  let options = {
    maxAge: 1000 * 60 * 15, // would expire after 15 minutes
    // secure: true, // to ensure browser sends cookie over https
    httpOnly: true, // The cookie only accessible by the web server
    signed: true // Indicates if the cookie should be signed
  };

  // Set cookie
  responseObject.cookie(userConstant.loginCookieName, cookieValue, options); // options is optional
}

/**
 * Method to delete login cookie
 *
 * @param responseObject
 */
function deleteLoginCookie(responseObject) {
  responseObject.clearCookie(userConstant.loginCookieName);
}

module.exports = router;
