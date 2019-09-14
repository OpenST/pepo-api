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

    const userTopUpKeyConfig = {
      id: { isNullAllowed: false },
      fromUserId: { isNullAllowed: false },
      transactionUuid: { isNullAllowed: true },
      amount: { isNullAllowed: false },
      pepoAmountInWei: { isNullAllowed: false },
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
      displayStatus = null;

    if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationPendingStatus) {
      isConsumable = 0;
      displayStatus = 'PROCESSING';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationSuccessStatus) {
      startPolling = 1;
      displayStatus = 'PROCESSING';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationCancelledStatus) {
      displayStatus = 'CANCELLED';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.receiptValidationFailedStatus) {
      displayStatus = 'FAILED';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.pepoTransferSuccessStatus) {
      displayStatus = 'SUCCESS';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.pepoTransferFailedStatus) {
      displayStatus = 'FAILED';
    } else if (oThis.userTopUp.status === fiatPaymentConstants.testPaymentStatus) {
      displayStatus = 'TEST_ORDER';
    }

    let response = {
      id: oThis.userTopUp.id,
      user_id: oThis.userTopUp.fromUserId,
      uts: oThis.userTopUp.updatedAt,
      transaction_uuid: oThis.userTopUp.transactionUuid,
      fiat_amount: oThis.userTopUp.amount,
      pepo_amount: oThis.userTopUp.pepoAmountInWei,
      is_consumable: isConsumable,
      start_polling: startPolling,
      display_status: displayStatus,
      status: oThis.userTopUp.status
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = UserTopUpsSingleFormatter;
