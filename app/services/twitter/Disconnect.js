const rootPrefix = '../../..',
  Logout = require(rootPrefix + '/app/services/Logout'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

class TwitterDisconnect extends ServiceBase {
  /**
   * Constructor for TwitterDisconnect service.
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
    oThis.currentUserId = params.current_user.id;

    //NOTE: DO NOT ASK FOR DEVICE ID AS ALL DEVICES SHOULD BE LOGGED OUT
    // oThis.deviceId = params.device_id;

    oThis.deviceIds = [];
    oThis.userDeviceIds = [];
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getTwitterUserId();

    await oThis._markTokenNull();

    await oThis._rotateCookieToken();

    await oThis._fetchDeviceIds();

    await oThis._fetchDevices();

    await oThis._logoutUserDevices();

    return responseHelper.successWithData({});
  }

  /**
   * Get twitter user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTwitterUserId() {
    const oThis = this;

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    oThis.twitterUserId = twitterUserCacheRsp.data[oThis.currentUserId].id;
  }

  /**
   * Mark token and secret null in twitter users extended.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenNull() {
    const oThis = this;

    await new TwitterUserExtendedModel()
      .update({
        token: null,
        secret: null,
        access_type: twitterUserExtendedConstants.invertedAccessTypes[twitterUserExtendedConstants.noneAccessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.expiredStatus]
      })
      .where({ twitter_user_id: oThis.twitterUserId })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      twitterUserId: oThis.twitterUserId
    });
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

module.exports = TwitterDisconnect;
