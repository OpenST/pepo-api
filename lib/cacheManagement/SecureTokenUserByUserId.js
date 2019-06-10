/**
 * Cache to fetch secure token user details by user_id
 *
 * @module lib/cacheManagement/SecureTokenUserByUserId
 */
const rootPrefix = '../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms.js'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to fetch secure token user details by user_id
 *
 * @class SecureTokenUserByUserId
 */
class SecureTokenUserByUserId extends CacheManagementBase {
  /**
   * Constructor to get secure token user details by user_id.
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

    oThis.userId = params.userId;

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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_s_token_user_by_uid_${oThis.userId}`;

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
    let fetchSecureByUserIdRsp = await new TokenUserModel().fetchSecureByUserId(oThis.userId);

    if (fetchSecureByUserIdRsp.id) {
      let encryptRsp = await oThis._kmsDecryptWithLocalCipherEncrypt(
        fetchSecureByUserIdRsp.encryptionSalt,
        kmsGlobalConstant.tokenUserScryptSaltPurpose
      );

      if (encryptRsp.isSuccess()) {
        fetchSecureByUserIdRsp.encryptionSaltLc = encryptRsp.data.encryptedData;
        return responseHelper.successWithData(fetchSecureByUserIdRsp);
      }
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = SecureTokenUserByUserId;
