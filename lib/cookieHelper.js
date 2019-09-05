const rootPrefix = '..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

/**
 * Class for cookie helper.
 *
 * @class CookieHelper
 */
class CookieHelper {
  /**
   * Set login cookie.
   *
   * @param {object} responseObject
   * @param {string} cookieValue
   */
  setLoginCookie(responseObject, cookieValue) {
    const options = {
      maxAge: 1000 * userConstants.cookieExpiryTime, // Cookie would expire after 15 minutes.
      httpOnly: true, // The cookie only accessible by the web server.
      signed: true, // Indicates if the cookie should be signed.
      path: '/',
      domain: coreConstants.PA_COOKIE_DOMAIN
    };

    // For non-development environments.
    if (basicHelper.isProduction()) {
      // || basicHelper.isStaging()) {
      options.secure = true; // To ensure browser sends cookie over https.
    }

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
    const options = {
      maxAge: 1000 * adminConstants.cookieExpiryTime, // Cookie would expire after 15 minutes.
      httpOnly: true, // The cookie only accessible by the web server.
      signed: true, // Indicates if the cookie should be signed.
      path: '/',
      domain: coreConstants.PA_COOKIE_DOMAIN
    };

    // For non-development environments.
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https.
    }

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
    const options = {
      maxAge: 1000 * preLaunchInviteConstants.dataCookieExpiryTime, // Cookie would expire after 15 minutes.
      httpOnly: true, // The cookie only accessible by the web server.
      signed: true, // Indicates if the cookie should be signed.
      path: '/',
      domain: coreConstants.PA_COOKIE_DOMAIN
    };

    // For non-development environments.
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https.
    }

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
    const options = {
      maxAge: 1000 * preLaunchInviteConstants.loginCookieExpiryTime, // Cookie would expire after 15 minutes.
      httpOnly: true, // The cookie only accessible by the web server.
      signed: true, // Indicates if the cookie should be signed.
      path: '/',
      domain: coreConstants.PA_COOKIE_DOMAIN
    };

    // For non-development environments.
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https.
    }

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
