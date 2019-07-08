const rootPrefix = '../../..',
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get user from cache.
 *
 * @class UserByUserName
 */
class UserByUserName extends CacheSingleBase {
  /**
   * Constructor to get user from cache using user name.
   *
   * @param {object} params
   * @param {String} params.userName
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

    oThis.userName = params.userName;
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

    oThis.useObject = false;
  }

  /**
   * Set cache implementer in oThis.cacheImplementer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setCacheImplementer() {
    const oThis = this;

    if (oThis.cacheImplementer) {
      return;
    }

    let cacheObject = await MemcachedProvider.getInstance(oThis.consistentBehavior);

    // Set cacheImplementer to perform caching operations.
    oThis.cacheImplementer = cacheObject.cacheInstance;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_u_un_${oThis.userName}`;

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

    oThis.cacheExpiry = cacheManagementConst.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    // This value is only returned if cache is not set.
    let userObj = await new UserModel().fetchByUserName(oThis.userName);

    return responseHelper.successWithData(userObj);
  }
}

module.exports = UserByUserName;
