const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure preLaunchInvite from cache.
 *
 * @class SecurePreLaunchInviteById
 */
class SecurePreLaunchInviteById extends CacheSingleBase {
  /**
   * Constructor to get secure preLaunchInvite object from cache using id.
   *
   * @param {object} params
   * @param {integer} params.id
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

    oThis.id = params.id;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_splu_id_${oThis.id}`;

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
    let preLaunchInviteObj = await new PreLaunchInviteModel().fetchSecureById(oThis.id);

    if (preLaunchInviteObj.id) {
      let encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        preLaunchInviteObj.encryptionSalt,
        kmsGlobalConstant.userPasswordEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        preLaunchInviteObj.encryptionSaltLc = encryptRes.data.encryptedData;
      } else {
        return Promise.reject(encryptRes);
      }
    }

    return responseHelper.successWithData(preLaunchInviteObj);
  }
}

module.exports = SecurePreLaunchInviteById;
