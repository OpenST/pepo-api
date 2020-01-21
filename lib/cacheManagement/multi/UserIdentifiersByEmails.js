const rootPrefix = '../../..',
  UserIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for user identifiers by emails cache.
 *
 * @class UserIdentifiersByEmails
 */
class UserIdentifiersByEmails extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<string>} params.emails
   *
   * @sets oThis.emails
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.emails = params.emails;
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

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;

    for (let index = 0; index < oThis.emails.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ube_uibe_' + oThis.emails[index]] = oThis.emails[index];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry.
   *
   * @sets oThis.cacheExpiry
   *
   * @private
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const userIdsByEmailIds = await new UserIdentifierModel().fetchUserIdsByEmails(cacheMissIds);

    return responseHelper.successWithData(userIdsByEmailIds);
  }
}

module.exports = UserIdentifiersByEmails;
