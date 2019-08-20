const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get admin from cache.
 *
 * @class AdminByEmail
 */
class AdminByEmail extends CacheSingleBase {
  /**
   * Constructor to get admin from cache using email.
   *
   * @param {object} params
   * @param {String} params.email
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

    oThis.email = params.email.toString().toLowerCase();
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

    oThis.useObject = false;
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
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_ad_em_${oThis.email}`;

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
    let resp = await new AdminModel().fetchByEmail(oThis.email);

    if (resp[oThis.email] && resp[oThis.email].id) {
      let encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        resp[oThis.email].encryptionSalt,
        kmsGlobalConstant.userPasswordEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        resp[oThis.email].encryptionSalt = encryptRes.data.encryptedData;
      } else {
        return Promise.reject(encryptRes);
      }
    }

    return responseHelper.successWithData(resp);
  }
}

module.exports = AdminByEmail;
