/**
 * Module to test cache management.
 *
 * @module lib/cacheManagement/SecureTokenData
 */
const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  TokenModel = require(rootPrefix + '/app/models/mysql/Token'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure Token Data form cache.
 *
 * @class SecureTokenData
 */
class SecureTokenData extends CacheManagementBase {
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_secure_token`;

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
    let tokenObj = await new TokenModel().fetchToken();

    if (tokenObj.data.id) {
      let encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        tokenObj.data.encryptionSalt,
        kmsGlobalConstant.platformApiSecretEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        tokenObj.encryptionSalt = encryptRes.data.encryptedData;
        return responseHelper.successWithData(tokenObj);
      }
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = SecureTokenData;
