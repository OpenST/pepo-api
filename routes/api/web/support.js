const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = '../../..',
  routeHelper = require(rootPrefix + '/routes/helper'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

// Node.js cookie parsing middleware.
router.use(cookieParser(coreConstants.COOKIE_SECRET));

const validateTokenIfPresent = async function(req, res, next) {
  let token = req.decodedParams.rt;

  console.log('token', token);

  if (!commonValidator.isVarNullOrUndefined(token)) {
    let decodedToken = base64Helper.decode(token);

    let userIdFromToken = decodedToken.split(':')[0];

    // if cookie was parsed correctly, userIdFromToken should be equal to user id from cookie, Otherwise, token will get priority.
    // token validation should not be done before cookie validation because token is short-lived.
    if (req.decodedParams.current_user) {
      if (userIdFromToken != req.decodedParams.current_user.id) {
        // clear the current_user
        delete req.decodedParams.current_user;

        // delete user login cookie value
        delete req.decodedParams.user_login_cookie_value;

        // delete the login cookie
        cookieHelper.deleteLoginCookie(res);
      } else {
        // don't validate anything as cookie validation is in place.
        return next();
      }
    }

    // if code reaches here, you will need to validate the token
    let authResponse = await new LoginCookieAuth(decodedToken).perform().catch(function(r) {
      return r;
    });

    if (authResponse.isSuccess()) {
      req.decodedParams.current_user = authResponse.data.current_user;
      // req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
      // cookieHelper.setLoginCookie(res, authResponse.data.user_login_cookie_value);
    }
  }

  next();
};

/* Subscribe email*/
router.get(
  '/',
  cookieHelper.parseUserLoginCookieIfPresent,
  sanitizer.sanitizeDynamicUrlParams,
  validateTokenIfPresent,
  cookieHelper.validateUserLoginRequired,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.validateSupportUrl;

    Promise.resolve(routeHelper.perform(req, res, next, '/support/Validate', 'r_a_w_s_1', null));
  }
);

module.exports = router;
