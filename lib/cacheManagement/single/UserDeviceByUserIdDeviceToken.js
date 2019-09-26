const rootPrefix = '../../..',
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get external entities from cache using entity id.
 *
 * @class UserDeviceByUserIdDeviceToken
 */
class UserDeviceByUserIdDeviceToken extends CacheSingleBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {String} params.deviceToken
   * @param {String} params.userId
   *
   * @augments CacheSingleBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init Params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.deviceToken = params.deviceToken;
    oThis.userId = params.userId;
  }

  /**
   * Set use object
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = true;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_cmm_uid_${oThis.userId}_dt_${util.createMd5Digest(oThis.deviceToken)}`;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let fetchByUserIdsRsp = await new UserDeviceModel().fetchUserDeviceIdsByDeviceTokens({
      deviceToken: oThis.deviceToken,
      userId: oThis.userId
    });

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = UserDeviceByUserIdDeviceToken;
