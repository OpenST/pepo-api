/**
 * This service processes the pending transaction
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

    oThis.currentUserId = params.currentUserId;
    oThis.userStat = params.userStat;
    oThis.videoDetailsMap = params.videoDetailsMap;
    oThis.currentUserUserContributionsMap = params.currentUserUserContributionsMap;
    oThis.currentUserVideoContributionsMap = params.currentUserVideoContributionsMap;
    oThis.processedData = null;
  }

  /**
   * perform - perform pending transaction
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._processPendingTransaction();

    return responseHelper.successWithData(oThis.processedData);
  }

  /**
   *
   * @returns {Promise<*>}
   * @private
   */
  async _processPendingTransaction() {
    const oThis = this;

    let secureTokenUserRsp = await new SecureTokenUserByUserIdCache({ userId: oThis.userId }).fetch();

    if (secureTokenUserRsp.isFailure()) {
      return Promise.reject(secureTokenUserRsp);
    }

    if (!secureTokenUserRsp.data.id) {
      logger.error('Error while fetching data from token user cache');
      return Promise.reject(secureTokenUserRsp);
    }

    return secureTokenUserRsp.data;
  }
}

module.exports = RecoveryInfo;
