const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  pricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  pepocornProductConstants = require(rootPrefix + '/lib/globalConstant/pepocornProduct');

/**
 * Class to get info for pepocorn topup.
 *
 * @class GetPepocornTopUpInfo
 */
class GetPepocornTopUpInfo extends ServiceBase {
  /**
   * Constructor to get info for pepocorn topup.
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

    oThis.currentUserId = params.current_user.id;

    oThis.productInfo = {};
    oThis.pricePoints = {};
    oThis.companyTokenHolder = null;
    oThis.stakeCurrency = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const promises = [oThis._fetchPricePoints(), oThis._fetchCompanyTokenHolderAddress()];
    await Promise.all(promises);

    oThis._fetchProductInfo();

    return responseHelper.successWithData({
      [entityTypeConstants.pepocornTopupInfo]: oThis.productInfo,
      [entityTypeConstants.pricePointsMap]: oThis.pricePoints
    });
  }

  /**
   * Fetch price points.
   *
   * @sets oThis.pricePoints
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const pricePointsCacheRsp = await new PricePointsCache().fetch();
    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data;
  }

  /**
   * Fetch company token holder address.
   *
   * @sets oThis.companyTokenHolder, oThis.stakeCurrency
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCompanyTokenHolderAddress() {
    const oThis = this;

    const tokenDetailsRsp = await new SecureTokenCache({}).fetch();
    if (tokenDetailsRsp.isFailure()) {
      logger.error('Error while fetching data from secure token cache');

      return Promise.reject(tokenDetailsRsp);
    }

    oThis.companyTokenHolder = tokenDetailsRsp.data.companyTokenHolderAddress;
    oThis.stakeCurrency = tokenDetailsRsp.data.stakeCurrency;
  }

  /**
   * Fetch product info.
   *
   * @sets oThis.productInfo
   *
   * @private
   */
  _fetchProductInfo() {
    const oThis = this;

    const usdPricePoint = oThis.pricePoints[oThis.stakeCurrency][pricePointConstants.usdQuoteCurrency],
      pepoInOneStepFactor = pepocornProductConstants.pepoPerStepFactor(
        pepocornProductConstants.productStepFactor,
        usdPricePoint
      );

    oThis.productInfo = {
      productId: pepocornProductConstants.productId,
      name: pepocornProductConstants.productName,
      productStepFactor: pepocornProductConstants.productStepFactor,
      pepoInOneStepFactor: pepoInOneStepFactor,
      dollarInOneStepFactor: pepocornProductConstants.dollarInOneStepFactor,
      companyTokenHolder: oThis.companyTokenHolder
    };
  }
}

module.exports = GetPepocornTopUpInfo;
