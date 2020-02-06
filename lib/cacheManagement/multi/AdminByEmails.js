const rootPrefix = '../../..',
  AdminModel = require(rootPrefix + '/app/models/mysql/admin/Admin'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for admin ids by emails cache.
 *
 * @class AdminByEmails
 */
class AdminByEmails extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array} params.emails
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
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
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
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ae_em_' + oThis.emails[index]] = oThis.emails[index];
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

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param {array} cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByEmailsRsp = await new AdminModel().fetchByEmail(cacheMissIds);

    return responseHelper.successWithData(fetchByEmailsRsp);
  }
}

module.exports = AdminByEmails;
