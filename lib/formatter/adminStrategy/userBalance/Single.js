const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user balance entity formatter.
 *
 * @class UserBalance
 */
class UserBalance extends BaseFormatter {
  /**
   * Constructor for user balance entity formatter.
   *
   * @param {object} params
   * @param {object} params.userBalance
   * @param {number} params.userBalance.balanceInUsd
   * @param {number} params.userBalance.balanceInPepo
   * @param {number} params.userBalance.pepocornBalance
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.balance = params.userBalance;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userBalanceKeyConfig = {
      balanceInUsd: { isNullAllowed: false },
      balanceInPepo: { isNullAllowed: false },
      pepocornBalance: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.balance, userBalanceKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      balance_usd: oThis.balance.balanceInUsd,
      balance_pepo: oThis.balance.balanceInPepo,
      balance_pepocorn: oThis.balance.pepocornBalance
    });
  }
}

module.exports = UserBalance;
