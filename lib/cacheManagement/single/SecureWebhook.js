const rootPrefix = '../../..',
  InMemoryCacheProvider = require(rootPrefix + '/lib/providers/inMemoryCache'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  WebhookModel = require(rootPrefix + '/app/models/mysql/Webhook'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure Token Data from cache.
 *
 * @class SecureWebhookCache
 */
class SecureWebhookCache extends CacheSingleBase {
  /**
   * Constructor
   *
   * @param {object} params
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

    oThis.ostId = params.ostId;
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

    oThis.cacheType = cacheManagementConst.inMemory;
  }

  /**
   * Set cache implementer in oThis.cacheImplementer.
   *
   * @returns {Promise<void>}
   */
  async _setCacheImplementer() {
    const oThis = this;

    let cacheObject = InMemoryCacheProvider.getInstance(oThis.consistentBehavior);

    // Set cacheImplementer to perform caching operations
    oThis.cacheImplementer = cacheObject.cacheInstance;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_swh_oi_` + oThis.ostId;

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
    let webhookObj = await new WebhookModel().fetchWebhookByOstId(oThis.ostId);

    if (webhookObj.id) {
      let encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        webhookObj.encryptionSalt,
        kmsGlobalConstant.platformApiSecretEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        webhookObj.encryptionSaltLc = encryptRes.data.encryptedData;
      } else {
        return Promise.reject(encryptRes);
      }
    }

    return responseHelper.successWithData(webhookObj);
  }
}

module.exports = SecureWebhookCache;
