const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/SecureUserById'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  UserModel = require(rootPrefix + '/app/models/mysql/User');

class AuthLoginCookie {
  /**
   * Constructor
   *
   * @param cookieValue
   */
  constructor(cookieValue) {
    const oThis = this;

    oThis.cookieValue = cookieValue;

    oThis.userId = null;
    oThis.timestamp = null;
    oThis.token = null;
    oThis.current_user = null;
  }

  /**
   * Perform
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

    // TODO - remove this
    delete oThis.current_user['encryptionSalt'];
    delete oThis.current_user['password'];

    return responseHelper.successWithData({
      current_user: oThis.current_user
    });
  }

  /**
   * Validate
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
   * Set parts
   *
   * @return {Promise<*>}
   * @private
   */
  async _setParts() {
    const oThis = this;
    let cookieValueParts = oThis.cookieValue.split(':');

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

    let cacheResponse = await new SecureUserCache({ id: oThis.userId }).fetch();
    if (cacheResponse.isFailure()) return oThis._unauthorizedResponse('l_a_lc_vu_1');

    oThis.current_user = cacheResponse.data || {};

    if (oThis.current_user.status !== userConstant.activeStatus) {
      return oThis._unauthorizedResponse('l_a_lc_vu_2');
    }
  }

  /**
   * Validate Token
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateToken() {
    const oThis = this;
    let token = new UserModel().getCookieTokenFor(oThis.current_user, { timestamp: oThis.timestamp });
    if (token !== oThis.token) {
      return this._unauthorizedResponse('l_a_lc_vt_1');
    }
  }

  /**
   * Validate Timestamp
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
   * Unauthorized Response
   *
   * @param code
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
