const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common');

/**
 * Class to set login cookie.
 *
 * @class AuthLoginCookie
 */
class AuthLoginCookie {
  /**
   * Constructor to set login cookie.
   *
   * @param {string} cookieValue
   */
  constructor(cookieValue) {
    const oThis = this;

    oThis.cookieValue = cookieValue;

    oThis.userId = null;
    oThis.timestamp = null;
    oThis.token = null;
    oThis.current_user = null;
    oThis.userLoginCookieValue = null;
  }

  /**
   * Perform.
   *
   * @return {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._validate();

    await oThis._setParts();

    await oThis._validateUser();

    await oThis._validateToken();

    await oThis._validateTimestamp();

    await oThis._setCookie();

    return responseHelper.successWithData({
      current_user: new UserModel().safeFormattedData(oThis.current_user),
      user_login_cookie_value: oThis.userLoginCookieValue
    });
  }

  /**
   * Validate.
   *
   * @return {Promise<*>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (!commonValidator.validateString(oThis.cookieValue)) {
      return oThis._unauthorizedResponse('l_a_lc_v_1');
    }
  }

  /**
   * Set cookie parts.
   *
   * @return {Promise<*>}
   * @private
   */
  async _setParts() {
    const oThis = this;

    const cookieValueParts = oThis.cookieValue.split(':');

    if (cookieValueParts.length !== 3) {
      return oThis._unauthorizedResponse('l_a_lc_sp_1');
    }

    oThis.userId = cookieValueParts[0];
    oThis.timestamp = Number(cookieValueParts[1]);
    oThis.token = cookieValueParts[2];
  }

  /**
   * Validate user
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateUser() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.userId }).fetch();

    oThis.current_user = cacheResponse.data || {};

    if (oThis.current_user.status !== userConstant.activeStatus) {
      return oThis._unauthorizedResponse('l_a_lc_vu_2');
    }
  }

  /**
   * Validate token.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateToken() {
    const oThis = this;

    const token = new UserModel().getCookieTokenFor(oThis.current_user, { timestamp: oThis.timestamp });
    if (token !== oThis.token) {
      return this._unauthorizedResponse('l_a_lc_vt_1');
    }
  }

  /**
   * Validate timestamp.
   *
   * @returns {*}
   * @private
   */
  _validateTimestamp() {
    const oThis = this;

    if (Math.round(Date.now() / 1000) > Math.round(oThis.timestamp + userConstant.cookieExpiryTime)) {
      return oThis._unauthorizedResponse('l_a_lc_vti_1');
    }
  }

  /**
   * Set cookie
   *
   *
   * @Sets oThis.userLoginCookieValue
   * @private
   */
  _setCookie() {
    const oThis = this;

    oThis.userLoginCookieValue = new UserModel().getCookieValueFor(oThis.current_user, {
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Unauthorized response.
   *
   * @param {string} code
   *
   * @returns {Promise<never>}
   * @private
   */
  _unauthorizedResponse(code) {
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'unauthorized_api_request'
      })
    );
  }
}

module.exports = AuthLoginCookie;
