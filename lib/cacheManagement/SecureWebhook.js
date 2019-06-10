const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  WebhookModel = require(rootPrefix + '/app/models/mysql/Webhook'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure Token Data from cache.
 *
 * @class SecureWebhookCache
 */
class SecureWebhookCache extends CacheManagementBase {
  /**
   * Constructor
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

    oThis.ostId = params.ostId;

    oThis.cacheType = cacheManagementConst.inMemory;
    oThis.consistentBehavior = '1';
    oThis.useObject = true;

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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_secure_webhook_` + oThis.ostId;

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

    if (!webhookObj) {
      return responseHelper.successWithData(null);
    }

    let encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
      webhookObj.encryptionSalt,
      kmsGlobalConstant.platformApiSecretEncryptionPurpose
    );

    if (encryptRes.isSuccess()) {
      webhookObj.encryptionSaltLc = encryptRes.data.encryptedData;
      return responseHelper.successWithData(webhookObj);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = SecureWebhookCache;
