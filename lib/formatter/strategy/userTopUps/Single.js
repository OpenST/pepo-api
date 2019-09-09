const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User top up result formatter.
 *
 * @class UserTopUpsSingleFormatter
 */
class UserTopUpsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for user top up formatter.
   *
   * @param {object} params
   * @param {object} params.userTopUp
   *
   * @param {number} params.userTopUp.id
   * @param {number} params.userTopUp.updated_at
   * @param {object} params.userTopUp.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userTopUp = params.userTopUp;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userTopUpKeyConfig = {
      id: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      paymentId: { isNullAllowed: false },
      transactionUuid: { isNullAllowed: true },
      fiatAmount: { isNullAllowed: false },
      pepoAmount: { isNullAllowed: false },
      status: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userTopUp, userTopUpKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    let response = {
      id: oThis.userTopUp.id,
      user_id: oThis.userTopUp.userId,
      uts: oThis.userTopUp.updatedAt,
      payment_id: oThis.userTopUp.paymentId,
      transaction_uuid: oThis.userTopUp.transactionUuid,
      fiat_amount: oThis.userTopUp.fiatAmount,
      pepo_amount: oThis.userTopUp.pepoAmount,
      status: oThis.userTopUp.status
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = UserTopUpsSingleFormatter;
