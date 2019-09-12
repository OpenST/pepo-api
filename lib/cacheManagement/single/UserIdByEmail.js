const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get user id by email id from cache.
 *
 * @class UserIdByEmail
 */
class UserIdByEmail extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {string} params.email
   *
   * @sets oThis.email
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.email = params.email.toString().toLowerCase();
  }

  /**
   * Set use object.
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
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   * @private
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_uid_em_${oThis.email}`;

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

    oThis.cacheExpiry = cacheManagementConstants.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const resp = await new UserModel()
      .select('id')
      .where({ email: oThis.email })
      .fire();

    if (resp.length !== 0) {
      return responseHelper.successWithData({ userId: resp[0].id });
    }

    return responseHelper.successWithData({ userId: null });
  }
}

module.exports = UserIdByEmail;
