const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  WebhookEndpointModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEndpoint'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kmsGlobalConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for webhook endpoint by uuids cache.
 *
 * @class WebhookEndpointByUuids
 */
class WebhookEndpointByUuids extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.uuids
   *
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
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.uuids.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_wep_uuid_' + oThis.uuids[ind]] = oThis.uuids[ind];
    }
  }

  /**
   * Set cache expiry.
   *
   * @sets oThis.cacheExpiry
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids.
   *
   * @param {array<number>} cacheMissIds
   *
   * @returns {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    const fetchByUuidsRsp = await new WebhookEndpointModel().getByUuids({ uuids: cacheMissIds });

    for (const uuid in fetchByUuidsRsp) {
      const webhookEndpoint = fetchByUuidsRsp[uuid];

      //todo:webhook fix kms purpose

      if (webhookEndpoint.secretSalt) {
        const encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
          webhookEndpoint.secretSalt,
          kmsGlobalConstants.userPasswordEncryptionPurpose
        );

        if (encryptRes.isSuccess()) {
          webhookEndpoint.secretSaltLc = encryptRes.data.encryptedData;
        } else {
          return Promise.reject(encryptRes);
        }
      }
    }

    return responseHelper.successWithData(fetchByUuidsRsp);
  }
}

module.exports = WebhookEndpointByUuids;
