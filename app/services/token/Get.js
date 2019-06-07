/**
 * This service gets Token Details
 *
 * Note:-
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  secureTokenData = require(rootPrefix + '/lib/cacheManagement/secureTokenData'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetTokens extends ServiceBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * perform - perform get token details
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let tokenDetails = await oThis._fetchTokenDetails();

    return responseHelper.successWithData({ tokenDetails: tokenDetails });
  }

  /**
   * fetch Token Details
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTokenDetails() {
    let tokenDetailsRsp = await new secureTokenData({}).fetch();

    if (tokenDetailsRsp.isFailure()) {
      logger.error('Error while fetching data from secure token cache');
      return Promise.reject(tokenDetailsRsp);
    }

    return tokenDetailsRsp.data;
  }
}

module.exports = GetTokens;
