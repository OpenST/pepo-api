const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure user from cache.
 *
 * @class SecureUserById
 */
class SecureUserById extends CacheSingleBase {
  /**
   * Constructor to get secure user object from cache using id.
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_secure_user_by_uid_${oThis.id}`;

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
    let userObj = await new UserModel().fetchSecureById(oThis.id);

    if (userObj.id) {
      let encryptRes = await oThis._kmsDecryptWithLocalCipherEncrypt(
        userObj.encryptionSalt,
        kmsGlobalConstant.userPasswordEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        userObj.encryptionSaltLc = encryptRes.data.encryptedData;
        return responseHelper.successWithData(userObj);
      }
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = SecureUserById;
