const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to fetch secure token user details by user_id
 *
 * @class SecureTokenUserByUserId
 */
class SecureTokenUserByUserId extends CacheSingleBase {
  /**
   * Constructor to get secure token user details by user_id.
   *
   * @param {object} params
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_stu_ui_${oThis.userId}`;

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
      const secureUserRes = await new SecureUserCache({ id: fetchSecureByUserIdRsp.userId }).fetch();

      if (secureUserRes.isFailure() || !secureUserRes.data.id) {
        return Promise.reject(secureUserRes);
      }

      let encryptionSaltLc = secureUserRes.data.encryptionSaltLc;
      const lcDecryptedSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptionSaltLc);
      const scryptSaltDecrypted = localCipher.decrypt(lcDecryptedSalt, fetchSecureByUserIdRsp.scryptSalt);

      const scryptSaltLcEncrypted = localCipher.encrypt(coreConstants.CACHE_SHA_KEY, scryptSaltDecrypted);

      fetchSecureByUserIdRsp.scryptSaltLc = scryptSaltLcEncrypted;
    }

    return responseHelper.successWithData(fetchSecureByUserIdRsp);
  }
}

module.exports = SecureTokenUserByUserId;
