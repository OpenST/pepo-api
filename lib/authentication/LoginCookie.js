const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource');

/**
 * Class to validate and set login cookie.
 *
 * @class AuthLoginCookie
 */
class AuthLoginCookie {
  /**
   * Constructor to validate and set login cookie.
   *
   * @param {string} cookieValue
   * @param {object} options
   * @param {string} options.api_source
   * @param {string} [options.expiry]
   *
   * @constructor
   */
  constructor(cookieValue, options = {}) {
    const oThis = this;

    oThis.cookieValue = cookieValue;
    oThis.apiSource = options.api_source;
    oThis.cookieExpiry = options.expiry || userConstant.cookieExpiryTime;

    oThis.userId = null;
    oThis.timestamp = null;
    oThis.token = null;
    oThis.current_user = null;
    oThis.userLoginCookieValue = null;
    oThis.decryptedEncryptionSalt = null;

    oThis.cookieVersion = null;
    oThis.loginServiceType = null;
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

    await oThis._validateTimestamp();

    await oThis._validateToken();

    await oThis._setCookie();

    return responseHelper.successWithData({
      current_user: new UserModel().safeFormattedData(oThis.current_user),
      user_login_cookie_value: oThis.userLoginCookieValue,
      login_service_type: oThis.loginServiceType
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
   * // 2:user_id:login_service:ts:enc(2:user_id:login_service:ts:similar to before)
   *
   * @sets oThis.userId, oThis.timestamp, oThis.token
   *
   * @return {Promise<*>}
   * @private
   */
  async _setParts() {
    const oThis = this;

    const cookieValueParts = oThis.cookieValue.split(':');

    if (cookieValueParts.length !== 3 && cookieValueParts.length !== 5) {
      return oThis._unauthorizedResponse('l_a_lc_sp_1');
    }

    // NOTE - this cookie versioning has been introduced on 22/01/2020.
    if (cookieValueParts[0] === 'v2') {
      oThis.cookieVersion = cookieValueParts[0];
      oThis.userId = cookieValueParts[1];
      oThis.loginServiceType = cookieValueParts[2];
      oThis.timestamp = Number(cookieValueParts[3]);
      oThis.token = cookieValueParts[4];
    } else if (apiSourceConstants.isWebRequest(cookieValueParts[0])) {
      oThis.cookieVersion = cookieValueParts[0];
      oThis.userId = cookieValueParts[1];
      oThis.loginServiceType = cookieValueParts[2];
      oThis.timestamp = Number(cookieValueParts[3]);
      oThis.token = cookieValueParts[4];
    } else {
      return oThis._unauthorizedResponse('l_a_lc_sp_2');
    }

    if (
      (oThis.apiSource === apiSourceConstants.web && !apiSourceConstants.isWebRequest(oThis.cookieVersion)) ||
      (oThis.apiSource !== apiSourceConstants.web && oThis.cookieVersion != 'v2')
    ) {
      return oThis._unauthorizedResponse('l_a_lc_sp_3');
    }
  }

  /**
   * Validate user.
   *
   * @sets oThis.current_user
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateUser() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.userId }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.current_user = cacheResponse.data || {};

    if (oThis.current_user.status !== userConstant.activeStatus) {
      return oThis._unauthorizedResponse('l_a_lc_vu_2');
    }

    oThis.decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.current_user.encryptionSaltLc
    );
  }

  /**
   * Validate token.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateToken() {
    const oThis = this;

    let token = null;

    if (oThis.cookieVersion === 'v2') {
      token = new UserModel().getCookieTokenForVersionV2(oThis.current_user, oThis.decryptedEncryptionSalt, {
        timestamp: oThis.timestamp,
        loginServiceType: oThis.loginServiceType
      });
    } else if (apiSourceConstants.isWebRequest(oThis.cookieVersion)) {
      token = new UserModel().getCookieTokenForWeb(oThis.current_user, oThis.decryptedEncryptionSalt, {
        timestamp: oThis.timestamp,
        loginServiceType: oThis.loginServiceType
      });
    } else {
      return oThis._unauthorizedResponse('l_a_lc_vt_1');
    }

    if (token !== oThis.token) {
      return oThis._unauthorizedResponse('l_a_lc_vt_2');
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

    if (Math.round(Date.now() / 1000) > Math.round(oThis.timestamp + oThis.cookieExpiry)) {
      return oThis._unauthorizedResponse('l_a_lc_vti_1');
    }
  }

  /**
   * Set cookie.
   *
   * @sets oThis.userLoginCookieValue
   *
   * @private
   */
  _setCookie() {
    const oThis = this;

    oThis.userLoginCookieValue = new UserModel().getCookieValueFor(oThis.current_user, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000,
      loginServiceType: oThis.loginServiceType,
      apiSource: apiSourceConstants.isWebRequest(oThis.cookieVersion) ? apiSourceConstants.web : apiSourceConstants.app
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
