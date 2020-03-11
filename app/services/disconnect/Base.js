const rootPrefix = '../../..',
  Logout = require(rootPrefix + '/app/services/Logout'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource');

class DisconnectBase extends ServiceBase {
  /**
   * Constructor for DisconnectBase service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} params.api_source
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUserId = params.current_user ? params.current_user.id : null;
    oThis.apiSource = params.api_source;

    oThis.userDeviceIds = [];
    oThis.deviceIds = [];
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

    if (apiSourceConstants.isAppRequest(oThis.apiSource)) {
      await oThis._fetchDeviceIds();

      await oThis._fetchDevices();

      await oThis._logoutUserDevices();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get social Id.
   *
   * @private
   */
  _getSocialId() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Mark token null.
   *
   * @private
   */
  _markTokenNull() {
    throw new Error('Sub-class to implement.');
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
   * Fetch device ids
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchDeviceIds() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: [oThis.currentUserId] }).fetch();

    if (userDeviceCacheRsp.isFailure()) {
      return Promise.reject(userDeviceCacheRsp);
    }

    oThis.userDeviceIds = userDeviceCacheRsp.data[oThis.currentUserId];
  }

  /**
   * Fetch device
   *
   * @returns {Promise<*|result|Result|Response>}
   * @private
   */
  async _fetchDevices() {
    const oThis = this;

    let userDeviceByIdsCache = new UserDeviceByIdsCache({ ids: oThis.userDeviceIds });

    let cacheRsp = await userDeviceByIdsCache.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (const id in cacheRsp.data) {
      oThis.deviceIds.push(cacheRsp.data[id].deviceId);
    }
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
      deviceIds: oThis.deviceIds
    }).perform();
  }
}

module.exports = DisconnectBase;
