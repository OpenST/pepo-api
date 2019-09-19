const express = require('express'),
  router = express.Router();

const rootPrefix = '../../..',
  FormatterComposer = require(rootPrefix + '/lib/formatter/Composer'),
  routeHelper = require(rootPrefix + '/routes/helper'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  apiName = require(rootPrefix + '/lib/globalConstant/apiName'),
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  cookieHelper = require(rootPrefix + '/lib/cookieHelper');

const validateTokenIfPresent = async function(req, res, next) {
  let token = req.decodedParams.rt;

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
    let authResponse = await new LoginCookieAuth(decodedToken, userConstant.shortLivedAuthTokenExpiry)
      .perform()
      .catch(function(r) {
        return r;
      });

    if (authResponse.isSuccess()) {
      req.decodedParams.current_user = authResponse.data.current_user;
      req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
      cookieHelper.setLoginCookie(res, authResponse.data.user_login_cookie_value);
    }
  }

  next();
};

/* Subscribe email*/
router.get(
  '/products',
  cookieHelper.parseUserLoginCookieIfPresent,
  sanitizer.sanitizeDynamicUrlParams,
  validateTokenIfPresent,
  cookieHelper.validateUserLoginRequired,
  function(req, res, next) {
    req.decodedParams.apiName = apiName.getRedemptionProducts;

    Promise.resolve(routeHelper.perform(req, res, next, '/redemption/GetProductList', 'r_a_w_r_p_1', null));
  }
);

router.use(cookieHelper.validateUserLoginCookieIfPresent, cookieHelper.validateUserLoginRequired);

// request for redemption of a product
router.post('/', sanitizer.sanitizeDynamicUrlParams, function(req, res, next) {
  req.decodedParams.apiName = apiName.requestRedemption;

  const dataFormatterFunc = async function(serviceResponse) {
    const wrapperFormatterRsp = await new FormatterComposer({
      resultType: responseEntityKey.redemption,
      entityKindToResponseKeyMap: {
        [entityType.redemption]: responseEntityKey.redemption
      },
      serviceData: serviceResponse.data
    }).perform();

    serviceResponse.data = wrapperFormatterRsp.data;
  };

  Promise.resolve(routeHelper.perform(req, res, next, '/redemption/Request', 'r_a_w_r_2', null, dataFormatterFunc));
});

module.exports = router;
