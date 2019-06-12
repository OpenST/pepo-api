/**
 * This service gets recovery salt for user id
 *
 * Note:-
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  SecureTokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/SecureTokenUserByUserId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class RecoveryInfo extends ServiceBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.current_user.id;
  }

  /**
   * perform - perform user creation
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let cacheData = await oThis._fetchScryptSaltFromTokenUserCache();

    return oThis.decryptScryptSalt(cacheData);
  }

  /**
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchScryptSaltFromTokenUserCache() {
    const oThis = this;

    let secureTokenUserRsp = await new SecureTokenUserByUserIdCache({ userId: oThis.userId }).fetch();

    if (!secureTokenUserRsp.data.id) {
      logger.error('Error while fetching data from token user cache');
      return Promise.reject(secureTokenUserRsp);
    }

    return secureTokenUserRsp.data;
  }

  /**
   *
   *
   * @param cacheData
   * @returns {Promise<void>}
   */
  async decryptScryptSalt(cacheData) {
    const oThis = this;

    let encryptionSaltD = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, cacheData['encryptionSaltLc']);

    let scryptSaltD = localCipher.decrypt(encryptionSaltD, cacheData['scryptSalt']);

    return responseHelper.successWithData({ scryptSalt: scryptSaltD });
  }
}

module.exports = RecoveryInfo;
