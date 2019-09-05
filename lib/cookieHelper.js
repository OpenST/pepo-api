const rootPrefix = '..',
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin');

class CookieHelper {
  constructor() {}

  /**
   * Set login cookie
   *
   * @param responseObject
   * @param cookieValue
   */
  setLoginCookie(responseObject, cookieValue) {
    let options = {
      maxAge: 1000 * userConstant.cookieExpiryTime, // Cookie would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      signed: true, // Indicates if the cookie should be signed
      path: '/',
      domain: coreConstant.PA_COOKIE_DOMAIN,
      sameSite: 'strict'
    };

    // For non-development environments
    if (basicHelper.isProduction()) {
      // || basicHelper.isStaging()) {
      options.secure = true; // To ensure browser sends cookie over https
    }

    // Set cookie
    responseObject.cookie(userConstant.loginCookieName, cookieValue, options); // Options is optional
  }

  /**
   * Set admin cookie
   *
   * @param responseObject
   * @param cookieValue
   */
  setAdminCookie(responseObject, cookieValue) {
    let options = {
      maxAge: 1000 * adminConstants.cookieExpiryTime, // Cookie would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      signed: true, // Indicates if the cookie should be signed
      path: '/',
      domain: coreConstant.PA_COOKIE_DOMAIN,
      sameSite: 'strict'
    };

    // For non-development environments
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https
    }

    // Set cookie
    responseObject.cookie(adminConstants.loginCookieName, cookieValue, options); // Options is optional
  }

  /**
   * Set pre launch Invite cookie
   *
   * @param responseObject
   * @param cookieValue
   */
  setPreLaunchDataCookie(responseObject, cookieValue) {
    let options = {
      maxAge: 1000 * preLaunchInviteConstants.dataCookieExpiryTime, // Cookie would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      signed: true, // Indicates if the cookie should be signed
      path: '/',
      domain: coreConstant.PA_COOKIE_DOMAIN,
      sameSite: 'strict'
    };

    // For non-development environments
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https
    }

    // Set cookie
    responseObject.cookie(preLaunchInviteConstants.dataCookieName, cookieValue, options); // Options is optional
  }

  /**
   * Set pre launch Invite cookie
   *
   * @param responseObject
   * @param cookieValue
   */
  setPreLaunchInviteCookie(responseObject, cookieValue) {
    let options = {
      maxAge: 1000 * preLaunchInviteConstants.loginCookieExpiryTime, // Cookie would expire after 15 minutes
      httpOnly: true, // The cookie only accessible by the web server
      signed: true, // Indicates if the cookie should be signed
      path: '/',
      domain: coreConstant.PA_COOKIE_DOMAIN,
      sameSite: 'strict'
    };

    // For non-development environments
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https
    }

    // Set cookie
    responseObject.cookie(preLaunchInviteConstants.loginCookieName, cookieValue, options); // Options is optional
  }

  /**
   * Delete login cookie
   * @param responseObject
   */
  deleteLoginCookie(responseObject) {
    responseObject.clearCookie(userConstant.loginCookieName, { domain: coreConstant.PA_COOKIE_DOMAIN });
  }

  /**
   * Delete admin cookie
   * @param responseObject
   */
  deleteAdminCookie(responseObject) {
    responseObject.clearCookie(adminConstants.loginCookieName, { domain: coreConstant.PA_COOKIE_DOMAIN });
  }

  /**
   * Delete preLaunchInvite cookie
   * @param responseObject
   */
  deletePreLaunchInviteCookie(responseObject) {
    responseObject.clearCookie(preLaunchInviteConstants.loginCookieName, { domain: coreConstant.PA_COOKIE_DOMAIN });
  }
}

module.exports = new CookieHelper();
