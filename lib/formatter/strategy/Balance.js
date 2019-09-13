const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for balance formatter.
 *
 * @class DeviceFormatter
 */
class BalanceFormatter extends BaseFormatter {
  /**
   * Constructor for balance formatter.
   *
   * @param {object} params
   * @param {object} params.balance
   *
   * @param {string} params.balance.user_id
   * @param {string} params.balance.address
   * @param {string} params.balance.linked_address
   * @param {string} params.balance.api_signer_address
   * @param {string} params.balance.status
   * @param {string} params.balance.updated_timestamp
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.balance = params.balance;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const deviceKeyConfig = {
      user_id: { isNullAllowed: false },
      total_balance: { isNullAllowed: false },
      available_balance: { isNullAllowed: false },
      unsettled_debit: { isNullAllowed: false },
      updated_timestamp: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.balance, deviceKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      ost_user_id: oThis.balance.user_id,
      total_balance: oThis.balance.total_balance,
      available_balance: oThis.balance.available_balance,
      unsettled_debit: oThis.balance.unsettled_debit,
      updated_timestamp: Number(oThis.balance.updated_timestamp)
    });
  }
}

module.exports = BalanceFormatter;
