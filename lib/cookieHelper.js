const rootPrefix = '..',
  coreConstant = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user');

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
      domain: coreConstant.PA_COOKIE_DOMAIN
    };

    // For non-development environments
    if (basicHelper.isProduction()) {
      options.secure = true; // To ensure browser sends cookie over https
    }

    // Set cookie
    responseObject.cookie(userConstant.loginCookieName, cookieValue, options); // Options is optional
  }

  /**
   * Delete login cookie
   * @param responseObject
   */
  deleteLoginCookie(responseObject) {
    responseObject.clearCookie(userConstant.loginCookieName);
  }
}

module.exports = new CookieHelper();
