const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserBalance = require(rootPrefix + '/app/services/user/GetBalance'),
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

    let redemptionProducts = await new RedemptionProduct().getAll();

    let getUserBalanceResponse = await new GetUserBalance({ user_id: oThis.currentUser.id }).perform();

    return Promise.resolve(
      responseHelper.successWithData({
        redemption_products: redemptionProducts,
        balance: getUserBalanceResponse.data.balance
      })
    );
  }
}

module.exports = GetRedemptionInfo;
