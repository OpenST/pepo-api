/**
 * Module to test cache management.
 *
 * @module lib/cacheManagement/shared/UserByUserName
 */
const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get user form cache.
 *
 * @class UserByUserName
 */
class UserByUserName extends CacheManagementBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   *
   * @augments CacheManagementBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userName = params.userName;

    oThis.cacheType = cacheManagementConst.memcached;
    oThis.consistentBehavior = '1';
    oThis.useObject = false;

    // Call sub class method to set cache key using params provided.
    oThis.setCacheKey();

    // Call sub class method to set cache expiry using params provided.
    oThis.setCacheExpiry();

    // Call sub class method to set cache implementer using params provided.
    oThis.setCacheImplementer();
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_user_by_un_${oThis.userName}`;

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

    console.log('INSIDE CACHE=====userObj---', userObj);

    if (userObj.id) {
      return responseHelper.successWithData(userObj);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = UserByUserName;
