const csrf = require('csurf');

const rootPrefix = '..',
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  cookieConstants = require(rootPrefix + '/lib/globalConstant/cookie'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin/admin'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail'),
  base64Helper = require(rootPrefix + '/lib/base64Helper');

const setCookieDefaultOptions = {
  httpOnly: true,
  signed: true,
  path: '/',
  domain: coreConstants.PA_COOKIE_DOMAIN,
  secure: basicHelper.isProduction(),
  sameSite: 'strict'
};

const deleteCookieOptions = { domain: coreConstants.PA_COOKIE_DOMAIN };

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Class for cookie helper.
 *
 * @class CookieHelper
 */
class CookieHelper {
  /**
   * Set csrf for web.
   *
   * @returns {csrf}
   */
  setWebCsrf() {
    const cookieParams = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * cookieConstants.webCsrfCookieExpiryTime,
      key: cookieConstants.webCsrfCookieName
    });

    return csrf({
      cookie: cookieParams
    });
  }

  /**
   * Set csrf for admin.
   *
   * @returns {csrf}
   */
  setAdminCsrf() {
    const cookieParams = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * cookieConstants.adminCsrfCookieExpiryTime,
      key: cookieConstants.adminCsrfCookieName
    });

    return csrf({
      cookie: cookieParams
    });
  }

  /**
   * Set login cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setLoginCookie(responseObject, cookieValue) {
    const options = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * userConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(userConstants.loginCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set web login cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setWebLoginCookie(responseObject, cookieValue) {
    let options = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * userConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(userConstants.webLoginCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set webview login cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setWebviewLoginCookie(responseObject, cookieValue) {
    let options = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * userConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(userConstants.loginFromWebviewCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set store login cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setStoreLoginCookie(responseObject, cookieValue) {
    let options = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * userConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(userConstants.loginStoreCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set admin cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setAdminCookie(responseObject, cookieValue) {
    let options = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * adminConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(adminConstants.loginCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Delete login cookie.
   *
   * @param {object} responseObject
   */
  deleteLoginCookie(responseObject) {
    responseObject.clearCookie(userConstants.loginCookieName, deleteCookieOptions);
  }

  /**
   * Delete web login cookie.
   *
   * @param {object} responseObject
   */
  deleteWebLoginCookie(responseObject) {
    responseObject.clearCookie(userConstants.webLoginCookieName, deleteCookieOptions);
  }

  /**
   * Delete webview login cookie.
   *
   * @param {object} responseObject
   */
  deleteWebviewLoginCookie(responseObject) {
    responseObject.clearCookie(userConstants.loginFromWebviewCookieName, deleteCookieOptions);
  }

  /**
   * Delete store login cookie.
   *
   * @param {object} responseObject
   */
  deleteStoreLoginCookie(responseObject) {
    responseObject.clearCookie(userConstants.loginStoreCookieName, deleteCookieOptions);
  }

  /**
   * Delete admin cookie.
   *
   * @param {object} responseObject
   */
  deleteAdminCookie(responseObject) {
    responseObject.clearCookie(adminConstants.loginCookieName, deleteCookieOptions);
  }

  /**
   * Validate Cookie If present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateUserLoginCookieIfPresent(req, res, next) {
    let loginCookieValue = req.signedCookies[userConstants.loginCookieName];
    if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
      let authResponse = await new LoginCookieAuth(loginCookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isFailure()) {
        cookieHelperObj.deleteLoginCookie(res);
        return responseHelper.renderApiResponse(authResponse, res, errorConfig);
      } else {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
      }

      cookieHelperObj.setLoginCookie(res, authResponse.data.user_login_cookie_value);
    }
    next();
  }

  /**
   * Validate User's web login If present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateUserWebLoginCookieIfPresent(req, res, next) {
    let loginCookieValue = req.signedCookies[userConstants.webLoginCookieName];
    if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
      let authResponse = await new LoginCookieAuth(loginCookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isFailure()) {
        cookieHelperObj.deleteWebLoginCookie(res);
        return responseHelper.renderApiResponse(authResponse, res, errorConfig);
      } else {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
      }

      cookieHelperObj.setWebLoginCookie(res, authResponse.data.user_login_cookie_value);
    }
    next();
  }

  /**
   * Validate Cookie If present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateWebviewLoginCookieIfPresent(req, res, next) {
    let cookieValue = req.signedCookies[userConstants.loginFromWebviewCookieName];
    if (!commonValidator.isVarNullOrUndefined(cookieValue)) {
      let authResponse = await new LoginCookieAuth(cookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isFailure()) {
        cookieHelperObj.deleteWebviewLoginCookie(res);
        return responseHelper.renderApiResponse(authResponse, res, errorConfig);
      } else {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
      }

      cookieHelperObj.setWebviewLoginCookie(res, authResponse.data.user_login_cookie_value);
    }
    next();
  }

  /**
   * Validate store login cookie if present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateStoreLoginCookieIfPresent(req, res, next) {
    let cookieValue = req.signedCookies[userConstants.loginStoreCookieName];

    if (!commonValidator.isVarNullOrUndefined(cookieValue)) {
      let authResponse = await new LoginCookieAuth(cookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isFailure()) {
        cookieHelperObj.deleteStoreLoginCookie(res);
        return responseHelper.renderApiResponse(authResponse, res, errorConfig);
      } else {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
      }

      cookieHelperObj.setStoreLoginCookie(res, authResponse.data.user_login_cookie_value);
    }
    next();
  }

  /**
   * Validate Current User If present but do not render error
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async parseUserCookieForLogout(req, res, next) {
    let loginCookieValue = req.signedCookies[userConstants.loginCookieName];
    if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
      let authResponse = await new LoginCookieAuth(loginCookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isSuccess()) {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
      }
    }

    cookieHelperObj.deleteLoginCookie(res);

    next();
  }

  /**
   * Validate Current User If present but do not render error
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async parseUserWebLoginCookieForLogout(req, res, next) {
    let loginCookieValue = req.signedCookies[userConstants.webLoginCookieName];
    if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
      let authResponse = await new LoginCookieAuth(loginCookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isSuccess()) {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
      }
    }

    cookieHelperObj.deleteWebLoginCookie(res);

    next();
  }

  /**
   * Parse store login cookie if present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async parseStoreLoginCookieIfPresent(req, res, next) {
    let loginCookieValue = req.signedCookies[userConstants.loginStoreCookieName];
    if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
      let authResponse = await new LoginCookieAuth(loginCookieValue, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isFailure()) {
        cookieHelperObj.deleteStoreLoginCookie(res);
      } else {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
        cookieHelperObj.setStoreLoginCookie(res, authResponse.data.user_login_cookie_value);
      }
    }

    next();
  }

  /**
   * Validate Current User Is present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateUserLoginRequired(req, res, next) {
    let currentUser = req.decodedParams.current_user;

    if (!currentUser) {
      cookieHelperObj.deleteLoginCookie(res);

      const errResponse = responseHelper.error({
        internal_error_identifier: 'l_ch_1',
        api_error_identifier: 'unauthorized_api_request'
      });

      return responseHelper.renderApiResponse(errResponse, res, errorConfig);
    }
    next();
  }

  /**
   * Validate Current User Is present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateUserWebLoginCookieRequired(req, res, next) {
    let currentUser = req.decodedParams.current_user;

    if (!currentUser) {
      cookieHelperObj.deleteWebLoginCookie(res);

      const errResponse = responseHelper.error({
        internal_error_identifier: 'l_ch_2',
        api_error_identifier: 'unauthorized_api_request'
      });

      return responseHelper.renderApiResponse(errResponse, res, errorConfig);
    }
    next();
  }

  /**
   * Validate Current User Is present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateWebviewLoginCookieRequired(req, res, next) {
    let currentUser = req.decodedParams.current_user;

    if (!currentUser) {
      cookieHelperObj.deleteWebviewLoginCookie(res);

      const errResponse = responseHelper.error({
        internal_error_identifier: 'l_ch_3',
        api_error_identifier: 'unauthorized_api_request'
      });

      return responseHelper.renderApiResponse(errResponse, res, errorConfig);
    }
    next();
  }

  /**
   * Validate Current User Is present
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  async validateStoreLoginCookieRequired(req, res, next) {
    let currentUser = req.decodedParams.current_user;

    if (!currentUser) {
      cookieHelperObj.deleteStoreLoginCookie(res);

      const errResponse = responseHelper.error({
        internal_error_identifier: 'l_ch_4',
        api_error_identifier: 'unauthorized_api_request'
      });

      return responseHelper.renderApiResponse(errResponse, res, errorConfig);
    }
    next();
  }
  /**
   * Validate token if present.
   *
   * @param req
   * @param res
   * @param next
   * @returns {Promise<*>}
   */
  async validateTokenIfPresent(req, res, next) {
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

          delete req.decodedParams.login_service_type;

          // delete the login cookie
          cookieHelperObj.deleteWebviewLoginCookie(res);
        } else {
          // don't validate anything as cookie validation is in place.
          return next();
        }
      }

      // if code reaches here, you will need to validate the token
      let authResponse = await new LoginCookieAuth(decodedToken, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isSuccess()) {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
        cookieHelperObj.setWebviewLoginCookie(res, authResponse.data.user_login_cookie_value);
      }
    }

    next();
  }

  /**
   * Validate store request token if present.
   *
   * @param req
   * @param res
   * @param next
   * @returns {Promise<*>}
   */
  async validateStoreTokenIfPresent(req, res, next) {
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
          cookieHelperObj.deleteStoreLoginCookie(res);
        } else {
          // don't validate anything as cookie validation is in place.
          return next();
        }
      }

      // if code reaches here, you will need to validate the token
      let authResponse = await new LoginCookieAuth(decodedToken, { api_source: req.decodedParams.api_source })
        .perform()
        .catch(function(r) {
          return r;
        });

      if (authResponse.isSuccess()) {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
        req.decodedParams.login_service_type = authResponse.data.login_service_type;
        cookieHelperObj.setStoreLoginCookie(res, authResponse.data.user_login_cookie_value);
      }
    }

    next();
  }

  /**
   * Set utm cookie for user
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setUserUtmCookie(responseObject, cookieValue) {
    let options = Object.assign({}, setCookieDefaultOptions, {
      maxAge: 1000 * userConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(userConstants.utmCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Delete utm cookie for user.
   *
   * @param {object} responseObject
   */
  deleteUserUtmCookie(responseObject) {
    responseObject.clearCookie(userConstants.utmCookieName, { domain: coreConstants.PA_COOKIE_DOMAIN });
  }

  /**
   * Fetch User utm cookie if present
   *
   * @param req
   */
  fetchUserUtmCookie(req) {
    let utmCookieValue = req.signedCookies[userConstants.utmCookieName];
    const utm_params = userUtmDetailsConstants.parseUtmCookie(utmCookieValue);
    req.decodedParams.utm_params = sanitizer.sanitizeParams(utm_params);
  }

  /**
   * Fetch Invite code from cookie if present
   *
   * @param req
   */
  fetchInviteCodeCookie(req) {
    let inviteCode = req.signedCookies[userConstants.inviteCookieName];
    if (CommonValidators.validateNonBlankString(inviteCode)) {
      req.decodedParams.invite_code = sanitizer.sanitizeParams(inviteCode);
    }
  }

  /**
   * Delete invite code cookie.
   *
   * @param {object} responseObject
   */
  deleteInviteCodeCookie(responseObject) {
    responseObject.clearCookie(userConstants.inviteCookieName, { domain: coreConstants.PA_COOKIE_DOMAIN });
  }
}

const cookieHelperObj = new CookieHelper();
//Instead of using oThis, object is being used in this file as this is executed in express in a different
// scope which does not have information about oThis.
module.exports = cookieHelperObj;
