const csrf = require('csurf');

const rootPrefix = '..',
  LoginCookieAuth = require(rootPrefix + '/lib/authentication/LoginCookie'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

const cookieDefaultOptions = {
  httpOnly: true,
  signed: true,
  path: '/',
  domain: coreConstants.PA_COOKIE_DOMAIN,
  secure: basicHelper.isProduction(),
  sameSite: 'strict'
};

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Class for cookie helper.
 *
 * @class CookieHelper
 */
class CookieHelper {
  /**
   * Set Csrf for Web.
   *
   */
  setWebCsrf() {
    let cookieParams = Object.assign({}, cookieDefaultOptions, {
      maxAge: 1 * 60 * 60 * 24 * 30, // Cookie would expire after 30 day
      key: preLaunchInviteConstants.csrfCookieName
    });

    return csrf({
      cookie: cookieParams
    });
  }

  /**
   * Set Csrf for Admin.
   *
   */
  setAdminCsrf() {
    let cookieParams = Object.assign({}, cookieDefaultOptions, {
      maxAge: 1 * 60 * 60 * 24 * 30, // Cookie would expire after 30 day
      key: adminConstants.csrfCookieName
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
    let options = Object.assign({}, cookieDefaultOptions, {
      maxAge: 1000 * userConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(userConstants.loginCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set admin cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setAdminCookie(responseObject, cookieValue) {
    let options = Object.assign({}, cookieDefaultOptions, {
      maxAge: 1000 * adminConstants.cookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(adminConstants.loginCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set pre launch invite cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setPreLaunchDataCookie(responseObject, cookieValue) {
    let options = Object.assign({}, cookieDefaultOptions, {
      maxAge: 1000 * preLaunchInviteConstants.dataCookieExpiryTime
    });

    // Set cookie
    responseObject.cookie(preLaunchInviteConstants.dataCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Set pre launch invite cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setPreLaunchInviteCookie(responseObject, cookieValue) {
    let options = Object.assign({}, cookieDefaultOptions, {
      maxAge: 1000 * preLaunchInviteConstants.loginCookieExpiryTime
    });

    // Set cookie.
    responseObject.cookie(preLaunchInviteConstants.loginCookieName, cookieValue, options); // Options is optional.
  }

  /**
   * Delete login cookie.
   *
   * @param {object} responseObject
   */
  deleteLoginCookie(responseObject) {
    responseObject.clearCookie(userConstants.loginCookieName, { domain: coreConstants.PA_COOKIE_DOMAIN });
  }

  /**
   * Delete admin cookie.
   *
   * @param {object} responseObject
   */
  deleteAdminCookie(responseObject) {
    responseObject.clearCookie(adminConstants.loginCookieName, { domain: coreConstants.PA_COOKIE_DOMAIN });
  }

  /**
   * Delete pre launch invite cookie.
   *
   * @param {object} responseObject
   */
  deletePreLaunchInviteCookie(responseObject) {
    responseObject.clearCookie(preLaunchInviteConstants.loginCookieName, { domain: coreConstants.PA_COOKIE_DOMAIN });
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
      let authResponse = await new LoginCookieAuth(loginCookieValue).perform().catch(function(r) {
        return r;
      });

      if (authResponse.isFailure()) {
        cookieHelperObj.deleteLoginCookie(res);
        return responseHelper.renderApiResponse(authResponse, res, errorConfig);
      } else {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
      }

      cookieHelperObj.setLoginCookie(res, authResponse.data.user_login_cookie_value);
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
        internal_error_identifier: 'r_a_v1_i_1',
        api_error_identifier: 'unauthorized_api_request'
      });

      return responseHelper.renderApiResponse(errResponse, res, errorConfig);
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
  async validateUserCookieWithoutError(req, res, next) {
    let loginCookieValue = req.signedCookies[userConstants.loginCookieName];
    if (!commonValidator.isVarNullOrUndefined(loginCookieValue)) {
      let authResponse = await new LoginCookieAuth(loginCookieValue).perform().catch(function(r) {
        return r;
      });

      if (authResponse.isSuccess()) {
        req.decodedParams.current_user = authResponse.data.current_user;
        req.decodedParams.user_login_cookie_value = authResponse.data.user_login_cookie_value;
      }
    }

    cookieHelperObj.deleteLoginCookie(res);

    next();
  }
}
const cookieHelperObj = new CookieHelper();

module.exports = cookieHelperObj;
