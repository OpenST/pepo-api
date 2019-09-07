const rootPrefix = '../..',
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  SecurePreLaunchInviteCache = require(rootPrefix + '/lib/cacheManagement/single/SecurePreLaunchInvite'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher');

/**
 * Class to validate and set login cookie.
 *
 * @class PreLaunchAuthLoginCookie
 */
class PreLaunchAuthLoginCookie {
  /**
   * Constructor to validate and set login cookie.
   *
   * @param {string} cookieValue
   *
   * @constructor
   */
  constructor(cookieValue) {
    const oThis = this;

    oThis.cookieValue = cookieValue;

    oThis.preLaunchInviteId = null;
    oThis.timestamp = null;
    oThis.token = null;
    oThis.current_pre_launch_invite = null;
    oThis.preLaunchInviteLoginCookieValue = null;
    oThis.decryptedEncryptionSalt = null;
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

    await oThis._validatePreLaunchInvite();

    await oThis._validateToken();

    await oThis._validateTimestamp();

    await oThis._setCookie();

    return responseHelper.successWithData({
      current_pre_launch_invite: new PreLaunchInviteModel().safeFormattedData(oThis.current_pre_launch_invite),
      preLaunchInviteLoginCookieValue: oThis.preLaunchInviteLoginCookieValue
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
      return oThis._unauthorizedResponse('l_a_plilc_v_1');
    }
  }

  /**
   * Set cookie parts.
   *
   * @sets oThis.preLaunchInviteId, oThis.timestamp, oThis.token
   *
   * @return {Promise<*>}
   * @private
   */
  async _setParts() {
    const oThis = this;

    const cookieValueParts = oThis.cookieValue.split(':');

    if (cookieValueParts.length !== 3) {
      return oThis._unauthorizedResponse('l_a_plilc_sp_1');
    }

    oThis.preLaunchInviteId = cookieValueParts[0];
    oThis.timestamp = Number(cookieValueParts[1]);
    oThis.token = cookieValueParts[2];
  }

  /**
   * Validate pre_launch_invite.
   *
   * @sets oThis.current_pre_launch_invite
   *
   * @return {Promise<*>}
   * @private
   */
  async _validatePreLaunchInvite() {
    const oThis = this;

    const cacheResponse = await new SecurePreLaunchInviteCache({ id: oThis.preLaunchInviteId }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.current_pre_launch_invite = cacheResponse.data || {};

    if (!oThis.current_pre_launch_invite.id) {
      return oThis._unauthorizedResponse('l_a_plilc_v_1.1');
    }

    if (oThis.current_pre_launch_invite.status == preLaunchInviteConstant.blockedStatus) {
      return oThis._unauthorizedResponse('l_a_plilc_vu_2');
    }

    oThis.decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.current_pre_launch_invite.encryptionSaltLc
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

    const token = new PreLaunchInviteModel().getCookieTokenFor(
      oThis.current_pre_launch_invite,
      oThis.decryptedEncryptionSalt,
      {
        timestamp: oThis.timestamp
      }
    );

    if (token !== oThis.token) {
      return oThis._unauthorizedResponse('l_a_plilc_vt_1');
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

    if (Math.round(Date.now() / 1000) > Math.round(oThis.timestamp + preLaunchInviteConstant.cookieExpiryTime)) {
      return oThis._unauthorizedResponse('l_a_plilc_vti_1');
    }
  }

  /**
   * Set cookie.
   *
   * @sets oThis.preLaunchInviteLoginCookieValue
   *
   * @private
   */
  _setCookie() {
    const oThis = this;

    oThis.preLaunchInviteLoginCookieValue = new PreLaunchInviteModel().getCookieValueFor(
      oThis.current_pre_launch_invite,
      oThis.decryptedEncryptionSalt,
      {
        timestamp: Date.now() / 1000
      }
    );
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

module.exports = PreLaunchAuthLoginCookie;
