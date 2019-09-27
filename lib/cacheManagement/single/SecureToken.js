const rootPrefix = '../../..',
  TokenModel = require(rootPrefix + '/app/models/mysql/Token'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kmsGlobalConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get secure token data from cache.
 *
 * @class SecureTokenData
 */
class SecureTokenData extends CacheSingleBase {
  /**
   * Init Params in oThis.
   *
   * @private
   */
  _initParams() {
    // Nothing to init.
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
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.inMemory;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + '_secure_token';

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

    const tokenObj = await new TokenModel().fetchToken();

    if (tokenObj.id) {
      const encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        tokenObj.encryptionSalt,
        kmsGlobalConstants.platformApiSecretEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        tokenObj.encryptionSaltLc = encryptRes.data.encryptedData;
      } else {
        return Promise.reject(encryptRes);
      }
    }

    return responseHelper.successWithData(tokenObj);
  }
}

module.exports = SecureTokenData;
