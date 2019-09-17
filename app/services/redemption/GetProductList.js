const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  RedemptionCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  RedemptionProduct = require(rootPrefix + '/app/models/mysql/redemption/Product'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.pricePoints = {};
  }

  /**
   * async perform
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    let redemptionProductsRsp = await new RedemptionCache().fetch();
    if (redemptionProductsRsp.isFailure()) {
      return Promise.reject(redemptionProductsRsp);
    }

    let getUserBalanceResponse = await new GetUserBalance({ user_id: oThis.currentUser.id }).perform();

    await oThis._fetchPricePoints();

    return Promise.resolve(
      responseHelper.successWithData({
        redemption_products: redemptionProductsRsp.data['products'],
        balance: getUserBalanceResponse.data.balance,
        price_points: oThis.pricePoints
      })
    );
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
}

module.exports = GetRedemptionInfo;
