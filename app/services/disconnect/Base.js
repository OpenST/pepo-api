const rootPrefix = '../../..',
  Logout = require(rootPrefix + '/app/services/Logout'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher');

class DisconnectBase extends ServiceBase {
  /**
   * Constructor for DisconnectBase service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {object} params.device_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUserId = params.current_user ? params.current_user.id : null;

    oThis.deviceId = params.device_id;
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    // We cannot do logout without current user id
    if (!oThis.currentUserId) {
      return responseHelper.successWithData({});
    }

    await oThis._getSocialId();

    await oThis._markTokenNull();

    await oThis._rotateCookieToken();

    await oThis._logoutUserDevices();

    return responseHelper.successWithData({});
  }

  /**
   * Rotate cookie token.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _rotateCookieToken() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.currentUserId }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const secureCacheData = cacheResponse.data || {};

    oThis.decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureCacheData.encryptionSaltLc);
    const cookieToken = localCipher.generateRandomIv(32);
    oThis.encryptedCookieToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, cookieToken);

    await new UserModel()
      .update({
        cookie_token: oThis.encryptedCookieToken
      })
      .where({ id: oThis.currentUserId })
      .fire();

    // Clear secure user cache.
    await new SecureUserCache({ id: oThis.currentUserId }).clear();
  }

  /**
   * Logout user devices.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logoutUserDevices() {
    const oThis = this;

    await new Logout({
      current_user: { id: oThis.currentUserId },
      deviceIds: [oThis.deviceId]
    }).perform();
  }
}

module.exports = DisconnectBase;
