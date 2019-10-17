const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for pepocorn balance formatter.
 *
 * @class PepocornBalanceFormatter
 */
class PepocornBalanceFormatter extends BaseFormatter {
  /**
   * Constructor for pepocorn balance formatter.
   *
   * @param {object} params
   * @param {object} params.pepocornBalance
   * @param {number} params.pepocornBalance.userId
   * @param {number} params.pepocornBalance.balance
   * @param {number} params.pepocornBalance.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.pepocornBalance = params.pepocornBalance;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const pepocornBalanceKeyConfig = {
      userId: { isNullAllowed: false },
      balance: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.pepocornBalance, pepocornBalanceKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.pepocornBalance.userId),
      userId: Number(oThis.pepocornBalance.userId),
      balance: oThis.pepocornBalance.balance,
      uts: Number(oThis.pepocornBalance.updatedAt)
    });
  }
}

module.exports = PepocornBalanceFormatter;
