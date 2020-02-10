const rootPrefix = '../../..',
  AdminModel = require(rootPrefix + '/app/models/mysql/admin/Admin'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kmsGlobalConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get admin by id from cache.
 *
 * @class AdminById
 */
class AdminById extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.id = params.id;
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
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_ad_id_${oThis.id}`;

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

    const resp = await new AdminModel().fetchById(oThis.id);

    if (resp[oThis.id] && resp[oThis.id].id) {
      const encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        resp[oThis.id].encryptionSalt,
        kmsGlobalConstants.userPasswordEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        resp[oThis.id].encryptionSalt = encryptRes.data.encryptedData;
      } else {
        return Promise.reject(encryptRes);
      }
    }

    return responseHelper.successWithData(resp);
  }
}

module.exports = AdminById;
