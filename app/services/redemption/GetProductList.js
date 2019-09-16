const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  RedemptionCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  RedemptionProduct = require(rootPrefix + '/app/models/mysql/redemption/Product'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
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

    return Promise.resolve(
      responseHelper.successWithData({
        redemption_products: redemptionProductsRsp.data['products'],
        // balance_in_higer_unit: '1000000000000000000',
        balance_in_higer_unit: getUserBalanceResponse.data.balance
      })
    );
  }
}

module.exports = GetRedemptionInfo;
