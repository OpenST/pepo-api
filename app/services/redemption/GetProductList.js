const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  RedemptionProduct = require(rootPrefix + '/app/models/mysql/redemption/Product'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = +params.current_user;
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

    return Promise.resolve(responseHelper.successWithData({ redemption_products: redemptionProducts }));
  }
}

module.exports = GetRedemptionInfo;
