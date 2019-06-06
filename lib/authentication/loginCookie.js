const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + 'lib/validators/Common'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/SecureUserById'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user');

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

  _validateToken() {
    // user_id:timestamp:token
    // token = enc(user_id:timestamp:env_salt:password_salt_d)
  }

  _unauthorizedResponse(code) {
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'unauthorized_api_request'
      })
    );
  }
}
