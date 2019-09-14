const rootPrefix = '../../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
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
    oThis.productionEnvSandboxReceipt = 0;
    oThis.status = null;
  }

  /**
   * Perform
   *
   * @returns {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    let prodResp = await oThis._fetchProductData();
    if (prodResp.isFailure()) {
      return prodResp;
    }

    let validateResp = await oThis._validateReceipt();
    if (validateResp.isFailure()) {
      return validateResp;
    }

    await oThis._updatePaymentStatus();

    return responseHelper.successWithData({ productionEnvSandboxReceipt: oThis.productionEnvSandboxReceipt });
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
    throw 'Sub-class to implement';
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
        pepo_amount_in_wei: oThis.product.pepo_amount_in_wei * quantity, //Todo Payment: Multiply using big number.
        decrypted_receipt: JSON.stringify(oThis.receiptResponseData),
        status: fiatPaymentConstants.invertedStatuses[oThis.status]
      })
      .where({
        id: oThis.fiatPaymentId
      })
      .fire();

    await FiatPaymentModel.flushCache({
      fiatPaymentId: oThis.fiatPaymentId,
      userId: oThis.userId
    });

    return responseHelper.successWithData({});
  }

  /**
   * Mark payment status fail.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _markPaymentStatus(status) {
    const oThis = this;

    let fiatModelObj = new FiatPaymentModel().update({
      decrypted_receipt: JSON.stringify(oThis.receiptResponseData)
    });

    if (status) {
      fiatModelObj.update({ status: fiatPaymentConstants.invertedStatuses[status] });
    }
    await fiatModelObj.where({ id: oThis.fiatPaymentId }).fire();

    await FiatPaymentModel.flushCache({
      fiatPaymentId: oThis.fiatPaymentId,
      userId: oThis.userId
    });

    return responseHelper.successWithData({});
  }

  /**
   *
   * @param internalErrorIdentifier
   * @param status
   * @param error
   * @returns {Promise<any>}
   * @private
   */
  async _handleFailure(internalErrorIdentifier, status, error) {
    const oThis = this;

    await oThis._markPaymentStatus(status);

    let errorObject = responseHelper.error({
      internal_error_identifier: internalErrorIdentifier,
      api_error_identifier: 'invalid_params',
      debug_options: {
        error: JSON.stringify(error),
        receiptResponseData: oThis.receiptResponseData,
        fiatPaymentId: oThis.fiatPaymentId
      }
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    return Promise.resolve(errorObject);
  }
}

module.exports = PaymentProcessBase;
