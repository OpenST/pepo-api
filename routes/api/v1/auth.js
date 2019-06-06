const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  WrapperFormatter = require(rootPrefix + '/lib/formatter/Wrapper'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  resultType = require(rootPrefix + '/lib/globalConstant/resultType'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstant.COOKIE_SECRET));

/* Create user*/
router.get('/sign-up', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
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
      resultType: resultType.loggedInUser,
      entities: [resultType.loggedInUser],
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  const onServiceFailure = async function(serviceResponse) {
    // TODO - delete cookie here.
  };

  Promise.resolve(
    routeHelper.perform(
      req,
      res,
      next,
      '/userManagement/SignUp',
      'r_v1_wa_l_s_1',
      null,
      onServiceSuccess,
      onServiceFailure
    )
  );
});

module.exports = router;
