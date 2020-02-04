const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment');

class TopupSingleFormatter extends BaseFormatter {
  /**
   * Constructor for user top up formatter.
   *
   * @param {object} params
   * @param {object} params.topup
   *
   * @param {number} params.topup.id
   * @param {number} params.topup.updated_at
   * @param {object} params.topup.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.topup = params[entityTypeConstants.topup];
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

    oThis.topup['transactionUuid'] = oThis.topup['transactionUuid'] || null;

    return oThis.validateParameters(oThis.topup, userTopUpKeyConfig);
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

    if (oThis.topup.status === fiatPaymentConstants.receiptValidationPendingStatus) {
      isConsumable = 0;
      startPolling = 1;
      displayStatus = 'PROCESSING';
    } else if (oThis.topup.status === fiatPaymentConstants.receiptValidationSuccessStatus) {
      startPolling = 1;
      displayStatus = 'PROCESSING';
    } else if (oThis.topup.status === fiatPaymentConstants.receiptValidationCancelledStatus) {
      displayStatus = 'CANCELLED';
    } else if (oThis.topup.status === fiatPaymentConstants.receiptValidationFailedStatus) {
      displayStatus = 'FAILED';
    } else if (oThis.topup.status === fiatPaymentConstants.pepoTransferSuccessStatus) {
      displayStatus = 'SUCCESS';
    } else if (oThis.topup.status === fiatPaymentConstants.pepoTransferFailedStatus) {
      displayStatus = 'FAILED';
    } else if (oThis.topup.status === fiatPaymentConstants.testPaymentStatus) {
      displayStatus = 'TEST_ORDER';
    }

    let response = {
      id: oThis.topup.id,
      user_id: oThis.topup.fromUserId,
      uts: oThis.topup.updatedAt,
      transaction_uuid: oThis.topup.transactionUuid,
      fiat_amount: oThis.topup.amount,
      pepo_amount: oThis.topup.pepoAmountInWei,
      is_consumable: isConsumable,
      start_polling: startPolling,
      display_status: displayStatus,
      status: oThis.topup.status
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = TopupSingleFormatter;
