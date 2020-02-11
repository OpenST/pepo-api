const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminModel = require(rootPrefix + '/app/models/mysql/admin/Admin'),
  AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin/admin');

/**
 * Class to validate and set admin cookie.
 *
 * @class AdminCookie
 */
class AdminCookie {
  /**
   * Constructor to validate and set admin cookie.
   *
   * @param {string} cookieValue
   */
  constructor(cookieValue) {
    const oThis = this;

    oThis.cookieValue = cookieValue;

    oThis.adminId = null;
    oThis.timestamp = null;
    oThis.token = null;
    oThis.currentAdmin = null;
    oThis.adminLoginCookieValue = null;
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

    await oThis._validateAdmin();

    await oThis._validateToken();

    await oThis._validateTimestamp();

    await oThis._setCookie();

    return responseHelper.successWithData({
      current_admin: new AdminModel().safeFormattedData(oThis.currentAdmin),
      admin_login_cookie_value: oThis.adminLoginCookieValue
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

    if (!CommonValidators.validateString(oThis.cookieValue)) {
      return oThis._unauthorizedResponse('l_a_ac_v_1');
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
      return oThis._unauthorizedResponse('l_a_ac_sp_1');
    }

    oThis.adminId = cookieValueParts[0];
    oThis.timestamp = Number(cookieValueParts[1]);
    oThis.token = cookieValueParts[2];
  }

  /**
   * Validate admin
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAdmin() {
    const oThis = this;

    const cacheResponse = await new AdminByIdCache({ id: oThis.adminId }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.currentAdmin = cacheResponse.data[oThis.adminId] || {};

    if (oThis.currentAdmin.status !== adminConstants.activeStatus) {
      return oThis._unauthorizedResponse('l_a_ac_va_1');
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

    const token = new AdminModel().getCookieTokenFor(oThis.currentAdmin, {
      timestamp: oThis.timestamp
    });

    if (token !== oThis.token) {
      return oThis._unauthorizedResponse('l_a_ac_vt_1');
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

    if (Math.round(Date.now() / 1000) > Math.round(oThis.timestamp + adminConstants.cookieExpiryTime)) {
      return oThis._unauthorizedResponse('l_a_ac_vti_1');
    }
  }

  /**
   * Set cookie
   *
   *
   * @Sets oThis.adminLoginCookieValue
   * @private
   */
  _setCookie() {
    const oThis = this;

    oThis.adminLoginCookieValue = new AdminModel().getCookieValueFor(oThis.currentAdmin, {
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

module.exports = AdminCookie;
