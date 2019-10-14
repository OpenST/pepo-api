const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to validate pepocorn topup request
 *
 * @class ValidatePepocornTopup
 */
class ValidatePepocornTopup extends ServiceBase {
  /**
   * Constructor to validate pepocorn topup request
   *
   * @param {object} params
   * @param {number} params.product_id
   * @param {number} params.pepo_amount_in_wei
   * @param {number} params.pepocorn_amount
   * @param {number} params.pepo_usd_price_point
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
    oThis.productId = params.product_id;
    oThis.pepoAmount = params.pepo_amount_in_wei;
    oThis.pepocornAmount = params.pepocorn_amount;
    oThis.pepoUsdPricePoint = params.pepo_usd_price_point;
    oThis.currentUserId = params.current_user.id;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    return responseHelper.successWithData({});
  }
}

module.exports = ValidatePepocornTopup;
