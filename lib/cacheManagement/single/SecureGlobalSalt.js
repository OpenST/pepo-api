const rootPrefix = '../../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  GlobalSaltModel = require(rootPrefix + '/app/models/mysql/GlobalSalt'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  InMemoryCacheProvider = require(rootPrefix + '/lib/providers/inMemoryCache'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kmsPurposeConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get secure global salt from cache.
 *
 * @class SecureGlobalSalt
 */
class SecureGlobalSalt extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {string} params.globalSaltKind
   *
   * @sets oThis.globalSaltKind
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.globalSaltKind = params.globalSaltKind;
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

    if (oThis.cacheImplementer) {
      return;
    }

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

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_config_strategy_salt_${oThis.globalSaltKind}`;

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

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const globalSaltModelObj = new GlobalSaltModel();
    const addressSalt = await globalSaltModelObj.getByKind(oThis.globalSaltKind);

    if (!addressSalt[0]) {
      return Promise.reject(addressSalt);
    }

    const KMSObject = new KmsWrapper(kmsPurposeConstants.configStrategyEncryptionPurpose);
    const decryptedSalt = await KMSObject.decrypt(addressSalt[0].salt);

    if (!decryptedSalt.Plaintext) {
      return Promise.reject(decryptedSalt);
    }

    return responseHelper.successWithData({ addressSalt: decryptedSalt.Plaintext });
  }
}

module.exports = SecureGlobalSalt;
