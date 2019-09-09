const csrf = require('csurf');

const rootPrefix = '..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

const cookieDefaultOptions = {
  httpOnly: true,
  signed: true,
  path: '/',
  domain: coreConstants.PA_COOKIE_DOMAIN,
  secure: basicHelper.isProduction(),
  sameSite: 'strict'
};

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
}

module.exports = new CookieHelper();
