/**
 * Multi Cache for videos by ids
 *
 *
 * @module lib/cacheManagement/multi/WebhookEndpointByUuids
 */

const rootPrefix = '../../..',
  WebhookEndpointModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEndpoint'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class WebhookEndpointByUuids extends CacheMultiBase {
  /**
   * Init params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.uuids = params.uuids;
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
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.uuids.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_wep_uuid_' + oThis.uuids[ind]] = oThis.uuids[ind];
    }
  }

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    let fetchByIdsRsp = await new WebhookEndpointModel().getByUuids({ uuids: cacheMissIds });

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = WebhookEndpointByUuids;
