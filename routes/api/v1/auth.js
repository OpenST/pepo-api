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
  userConstant = require(rootPrefix + '/lib/globalConstant/user');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

/* Create user*/
router.post('/sign-up', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.signUp;

  const onServiceSuccess = async function(serviceResponse) {
    //Todo: Cookie Security Review
    let options = {
      maxAge: 1000 * 60 * 15, // would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      signed: true // Indicates if the cookie should be signed
    };

    // Set cookie
    res.cookie(userConstant.loginCookieName, serviceResponse.data.userLoginCookieValue, options); // options is optional

    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.loggedInUser,
      entities: [entityType.loggedInUser],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    // TODO - delete cookie here.
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/SignUp', 'r_a_v1_a_s_1', null, onServiceSuccess, onServiceFailure)
  );
});

/* Login user*/
router.post('/login', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.login;

  const onServiceSuccess = async function(serviceResponse) {
    //Todo: Cookie Security Review
    let options = {
      maxAge: 1000 * 60 * 15, // would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      signed: true // Indicates if the cookie should be signed
    };

    // Set cookie
    res.cookie(userConstant.loginCookieName, serviceResponse.data.userLoginCookieValue, options); // options is optional

    const wrapperFormatterRsp = await new WrapperFormatter({
      resultType: entityType.loggedInUser,
      entities: [entityType.loggedInUser],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    // TODO - delete cookie here.
  };

  Promise.resolve(
    routeHelper.perform(req, res, next, '/user/Login', 'r_a_v1_a_l_1', null, onServiceSuccess, onServiceFailure)
  );
});

module.exports = router;
