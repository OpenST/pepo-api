const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.productId = params.product_id;
  }

  /**
   * async perform
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    let redemptionId = uuidV4();

    return Promise.resolve(
      responseHelper.successWithData({
        redemption: {
          id: redemptionId,
          userId: oThis.currentUser.id,
          productId: oThis.productId,
          uts: parseInt(Date.now() / 1000)
        }
      })
    );
  }
}

module.exports = GetRedemptionInfo;
