const rootPrefix = '../../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Payment process base.
 *
 * @class PaymentProcessBase
 */
class PaymentProcessBase {
  constructor(params) {
    const oThis = this;

    oThis.paymentReceipt = params.paymentReceipt;
    oThis.userId = params.userId;
    oThis.fiatPaymentId = params.fiatPaymentId;

    oThis.receiptResponseData = null;
    oThis.product = null;
    oThis.productionSandbox = 0;
    oThis.status = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateReceipt();

    await oThis._fetchProductData();

    await oThis._updatePaymentStatus();

    await FiatPaymentModel.flushCache(oThis.fiatPaymentId);

    return responseHelper.successWithData({ productionSandbox: oThis.productionSandbox });
  }

  /**
   * Validate receipt.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateReceipt() {
    throw 'Sub-class to implement';
  }

  /**
   * Fetch production data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchProductData() {
    throw 'Sub-class to implement';
  }

  /**
   * Get purchase quantity.
   *
   * @returns {number}
   * @private
   */
  _getPurchasedQuantity() {
    return 1;
  }

  /**
   * Update payment status.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _updatePaymentStatus() {
    const oThis = this;

    let quantity = oThis._getPurchasedQuantity();

    await new FiatPaymentModel()
      .update({
        amount: oThis.product.amount_in_usd * quantity,
        pepo_amount: oThis.product.amount_in_pepo * quantity,
        decrypted_receipt: JSON.stringify(oThis.receiptResponseData),
        status: fiatPaymentConstants.invertedStatuses[oThis.status]
      })
      .where({
        id: oThis.fiatPaymentId
      })
      .fire();

    return responseHelper.successWithData({});
  }

  /**
   * Mark payment status fail.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _markPaymentStatusFail() {
    const oThis = this;

    await new FiatPaymentModel()
      .update({
        decrypted_receipt: JSON.stringify(oThis.receiptResponseData),
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.receiptValidationFailedStatus]
      })
      .where({
        id: oThis.fiatPaymentId
      })
      .fire();

    return responseHelper.successWithData({});
  }
}

module.exports = PaymentProcessBase;
