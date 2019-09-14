const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
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

    let uts = parseInt(Date.now() / 1000);

    let redemptionProducts = [
      {
        id: 1,
        kind: 'AMAZON',
        status: 'ACTIVE',
        uts: uts
      },
      {
        id: 2,
        kind: 'STARBUCKS',
        status: 'ACTIVE',
        uts: uts
      }
    ];

    return Promise.resolve(responseHelper.successWithData({ redemption_products: redemptionProducts }));
  }
}

module.exports = GetRedemptionInfo;
