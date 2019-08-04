const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Secure twitter user extended from cache.
 *
 * @class SecureTwitterUserExtendedByTwitterUserId
 */
class SecureTwitterUserExtendedByTwitterUserId extends CacheSingleBase {
  /**
   * Constructor to get secure twitter user extended object from cache using twitter user id.
   *
   * @param {object} params
   * @param {integer} params.twitterUserId
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

    oThis.twitterUserId = params.twitterUserId;
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

    oThis.cacheKey = oThis._cacheKeyPrefix() + `_s_twue_tuid_${oThis.twitterUserId}`;

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
    let twitterUserExtendedObj = await new TwitterUserExtendedModel().fetchSecureByTwitterUserId(oThis.twitterUserId);

    if (twitterUserExtendedObj.id) {
      const secureUserRes = await new SecureUserCache({ id: twitterUserExtendedObj.userId }).fetch();

      if (secureUserRes.isFailure() || !secureUserRes.data.id) {
        return Promise.reject(secureUserRes);
      }

      let encryptionSaltLc = secureUserRes.data.encryptionSaltLc;
      const lcDecryptedSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, encryptionSaltLc);
      const secretDecrypted = localCipher.decrypt(lcDecryptedSalt, twitterUserExtendedObj.secret);

      twitterUserExtendedObj.secretLc = localCipher.encrypt(coreConstants.CACHE_SHA_KEY, secretDecrypted);
    }

    return responseHelper.successWithData(twitterUserExtendedObj);
  }
}

module.exports = SecureTwitterUserExtendedByTwitterUserId;
