const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment');

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

    console.log('------oThis.userTopUp---------', oThis.userTopUp);

    const userTopUpKeyConfig = {
      id: { isNullAllowed: false },
      fromUserId: { isNullAllowed: false },
      transactionUuid: { isNullAllowed: true },
      amount: { isNullAllowed: false },
      pepoAmount: { isNullAllowed: false },
      status: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    oThis.userTopUp['transactionUuid'] = oThis.userTopUp['transactionUuid'] || null;

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

    let isConsumable = 1,
      startPolling = 0,
      errMessage = null;

    if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationPendingStatus) {
      isConsumable = 0;
      errMessage = 'Some difficulty in Payment validation!';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationSuccessStatus) {
      startPolling = 1;
    } else if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationFailedStatus) {
      errMessage = 'Could not verify your payment.';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.pepoTransferSuccessStatus) {
    } else if (oThis.userTopUp.status === fiatPaymentConstants.pepoTransferFailedStatus) {
      errMessage = 'Payment acknowledged! Some difficulty in pepo transfer.';
    }

    let response = {
      id: oThis.userTopUp.id,
      user_id: oThis.userTopUp.fromUserId,
      uts: oThis.userTopUp.updatedAt,
      transaction_uuid: oThis.userTopUp.transactionUuid,
      fiat_amount: oThis.userTopUp.amount,
      pepo_amount: oThis.userTopUp.pepoAmount,
      is_consumable: isConsumable,
      start_polling: startPolling,
      err_message: errMessage,
      status: oThis.userTopUp.status
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = UserTopUpsSingleFormatter;
