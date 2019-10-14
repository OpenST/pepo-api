const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get token details.
 *
 * @class GetTokens
 */
class GetTokens extends ServiceBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const tokenDetails = await oThis._fetchTokenDetails();

    return responseHelper.successWithData({ tokenDetails: tokenDetails });
  }

  /**
   * Fetch token details.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTokenDetails() {
    const tokenDetailsRsp = await new SecureTokenCache({}).fetch();
    if (tokenDetailsRsp.isFailure()) {
      logger.error('Error while fetching data from secure token cache');

      return Promise.reject(tokenDetailsRsp);
    }

    return tokenDetailsRsp.data;
  }
}

module.exports = GetTokens;
