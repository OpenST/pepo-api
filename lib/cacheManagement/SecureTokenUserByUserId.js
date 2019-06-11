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
  }

  /**
   * Init Params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;
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
