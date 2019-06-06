/**
 * Module to test cache management.
 *
 * @module lib/cacheManagement/shared/SecureUserByUserName
 */
const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms.js'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure user form cache.
 *
 * @class SecureUserByUserName
 */
class UserByUserName extends CacheManagementBase {
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

    oThis.userName = params.userName;

    oThis.cacheType = cacheManagementConst.memcached;
    oThis.consistentBehavior = '1';
    oThis.useObject = false;

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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_secure_user_by_un_${oThis.userName}`;

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
    let userObj = new UserModel().fetchSecureByUserName(oThis.userName);

    if (userObj.id) {
      let encryptRes = oThis._kmsDecryptWithLocalCipherEncrypt(
        userObj.encryptionSalt,
        kmsGlobalConstant.userPasswordEncryptionPurpose
      );

      if (encryptRes.isSuccess()) {
        userObj.encryptionSalt = encryptRes.encryptedData;
        return responseHelper.successWithData(userObj);
      }
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = UserByUserName;
