const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecureTokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/SecureTokenUserByUserId'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher');

/**
 * Class to get recovery information of current user.
 *
 * @class RecoveryInfo
 */
class RecoveryInfo extends ServiceBase {
  /**
   * Constructor to get recovery information of current user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.current_user.id;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const cacheData = await oThis._fetchScryptSaltFromTokenUserCache();

    return oThis.decryptScryptSalt(cacheData);
  }

  /**
   * Fetch scrypt salt from token user cache.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchScryptSaltFromTokenUserCache() {
    const oThis = this;

    const secureTokenUserRsp = await new SecureTokenUserByUserIdCache({ userId: oThis.userId }).fetch();
    if (secureTokenUserRsp.isFailure()) {
      return Promise.reject(secureTokenUserRsp);
    }

    if (!secureTokenUserRsp.data.id) {
      logger.error('Error while fetching data from token user cache');

      return Promise.reject(secureTokenUserRsp);
    }

    return secureTokenUserRsp.data;
  }

  /**
   * Decrypt scrypt salt.
   *
   * @param {object} cacheData
   *
   * @returns {Promise<result>}
   */
  async decryptScryptSalt(cacheData) {
    const scryptSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, cacheData.scryptSaltLc);

    return responseHelper.successWithData({ scryptSalt: scryptSaltD });
  }
}

module.exports = RecoveryInfo;
