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
  }

  async perform() {
    const oThis = this;

    await oThis._validateReceipt();

    await oThis._fetchProductData();

    await oThis._updatePaymentStatus();

    await FiatPaymentModel.flushCache();

    return responseHelper.successWithData({});
  }

  async _validateReceipt() {
    throw 'Sub-class to implement';
  }

  async _fetchProductData() {
    throw 'Sub-class to implement';
  }

  _getPurchasedQuantity() {
    return 1;
  }

  async _updatePaymentStatus() {
    const oThis = this;

    let quantity = oThis._getPurchasedQuantity();

    await new FiatPaymentModel()
      .update({
        amount: oThis.product.amount_in_usd * quantity,
        pepo_amount: oThis.product.amount_in_pepo * quantity,
        decrypted_receipt: JSON.stringify(oThis.receiptResponseData),
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.receiptValidationSuccessStatus]
      })
      .where({
        id: oThis.fiatPaymentId
      })
      .fire();

    return responseHelper.successWithData({});
  }

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
