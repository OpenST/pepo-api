const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/SecureUserById'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  userModel = require(rootPrefix + '/app/models/mysql/User');

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
    oThis.currentUser = null;
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

    return responseHelper.successWithData({
      currentUser: oThis.currentUser
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
    oThis.timestamp = cookieValueParts[1];
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

    let cacheResponse = await new SecureUserCache({ userId: oThis.userId }).fetch();
    if (cacheResponse.isFailure()) return oThis._unauthorizedResponse('l_a_lc_vu_1');

    oThis.currentUser = cacheResponse.data[oThis.userId] || {};

    if (oThis.currentUser.status !== userConstant.activeStatus) {
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
    let token = userModel.getCookieTokenFor(oThis.currentUser, { timestamp: oThis.timestamp });
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
    if (Date.now() / 1000 > oThis.timestamp + userConstant.cookieExpiryTime) {
      return this._unauthorizedResponse('l_a_lc_vti_1');
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
