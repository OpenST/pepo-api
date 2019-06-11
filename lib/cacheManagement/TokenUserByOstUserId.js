/**
 * Module to get token user from ost user id.
 *
 * @module lib/cacheManagement/shared/TokenUserByOstUserId
 */
const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get token user from cache using ost user id.
 *
 * @class TokenUserByOstUserId
 */
class TokenUserByOstUserId extends CacheManagementBase {
  /**
   * Constructor to test cache management.
   *
   * @param {object} params
   * @param {String} params.ostUserId
   *
   * @augments CacheManagementBase
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

    oThis.ostUserId = params.ostUserId;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_token_user_by_ouid_${oThis.ostUserId}`;

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
    let tokenUserObj = await new TokenUserModel().fetchByOstUserId(oThis.ostUserId);

    if (tokenUserObj.id) {
      return responseHelper.successWithData(tokenUserObj);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = TokenUserByOstUserId;
