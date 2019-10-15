const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  pepocornProductConstants = require(rootPrefix + '/lib/globalConstant/pepocornProduct'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  pricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get info for pepocorn topup
 *
 * @class GetPepocornTopUpInfo
 */
class GetPepocornTopUpInfo extends ServiceBase {
  /**
   * Constructor to get info for pepocorn topup
   *
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

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
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let promises = [];
    promises.push(oThis._fetchPricePoints());
    promises.push(oThis._fetchCompanyTokenHolderAddress());
    await Promise.all(promises);

    oThis._fetchProductInfo();

    return responseHelper.successWithData({
      [entityType.pepocornTopupInfo]: oThis.productInfo,
      [entityType.pricePointsMap]: oThis.pricePoints
    });
  }

  /**
   * Fetch product info
   *
   * @private
   */
  _fetchProductInfo() {
    const oThis = this;

    let usdPricePoint = oThis.pricePoints[oThis.stakeCurrency][pricePointConstants.usdQuoteCurrency],
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

  /**
   * Fetch price points.
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
   * Fetch company token holder address
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
}

module.exports = GetPepocornTopUpInfo;
