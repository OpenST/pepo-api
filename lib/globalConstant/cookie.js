/**
 * Class for cookie constants.
 *
 * @class Cookie
 */
class Cookie {
  get webCsrfCookieExpiryTime() {
    return 60 * 60 * 24; // 1 day
  }

  get webCsrfCookieName() {
    return '_cu_csrf';
  }

  get adminCsrfCookieExpiryTime() {
    return 60 * 60 * 24; // 1 day
  }

  get adminCsrfCookieName() {
    return '_ad_csrf';
  }
}

module.exports = new Cookie();
