const rootPrefix = '../../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class PaymentProcessBase {
  constructor(params) {
    const oThis = this;

    oThis.paymentReceipt = params.paymentReceipt;
    oThis.userId = params.userId;
    oThis.fiatPaymentId = params.fiatPaymentId;
    oThis.retryCount = params.retryCount;

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

    let prodResp = await oThis._fetchInAppProduct();
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
   * Fetch product data
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchInAppProduct() {
    const oThis = this;

    let productsData = await new InAppProductsModel()
      .select('*')
      .where(oThis._productWhereCondition())
      .fire();

    oThis.product = productsData[0];

    if (!oThis.product) {
      let errorObject = responseHelper.error({
        internal_error_identifier: 'invalid_product_id:a_s_p_p_b_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          reason: 'Invalid product id.',
          apple_product_id: oThis.paymentReceipt['productId']
        }
      });
      logger.error('Product id not found in our database.', errorObject.getDebugData());
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
      return Promise.resolve(errorObject);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update payment status.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _updatePaymentStatus() {
    const oThis = this;

    let quantity = oThis._getPurchasedQuantity(),
      pepoAmountInWeiBN = basicHelper.convertToBigNumber(oThis.product.pepo_amount_in_wei),
      totalAmountToTransfer = pepoAmountInWeiBN.mul(quantity).toString(10);

    await new FiatPaymentModel()
      .update({
        amount: oThis.product.amount_in_usd * quantity,
        pepo_amount_in_wei: totalAmountToTransfer,
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
   *
   * @param internalErrorIdentifier
   * @param status
   * @param errorData
   * @param severity
   * @returns {Promise<any>}
   * @private
   */
  async _handleFailure(internalErrorIdentifier, status, errorData, severity) {
    const oThis = this;

    await oThis._markPaymentStatus(status, errorData);

    let errorObject = responseHelper.error({
      internal_error_identifier: internalErrorIdentifier,
      api_error_identifier: 'invalid_params',
      debug_options: {
        error: JSON.stringify(errorData),
        receiptResponseData: oThis.receiptResponseData,
        fiatPaymentId: oThis.fiatPaymentId
      }
    });
    if (severity) {
      logger.error('Error: ', errorObject.getDebugData());
      await createErrorLogsEntry.perform(errorObject, severity);
    }
    return Promise.resolve(errorObject);
  }

  /**
   * Mark payment status fail.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _markPaymentStatus(status, errorData) {
    const oThis = this;

    let retryAfter = oThis._getRetryAfterTime(oThis.retryCount),
      fiatModelObj = new FiatPaymentModel().update({
        decrypted_receipt: JSON.stringify(oThis.receiptResponseData),
        retry_after: retryAfter,
        retry_count: oThis.retryCount + 1
      });

    if (errorData) {
      fiatModelObj.update({
        error_data: JSON.stringify(errorData)
      });
    }

    //Only if we are going to update status as pending, we update retry_after and retry_count.
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
   * get retry after time
   *
   * @param retryCount
   * @returns {number}
   * @private
   */
  _getRetryAfterTime(retryCount) {
    const oThis = this;

    return basicHelper.getCurrentTimestampInSeconds() + 50 * retryCount + 10;
  }
  /**
   * Product where condition
   *
   * @returns {number}
   * @private
   */
  _productWhereCondition() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Validate receipt.
   *
   * @returns {Promise<void>}
   * @private
   */
  _validateReceipt() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Get purchase quantity.
   *
   * @returns {number}
   * @private
   */
  _getPurchasedQuantity() {
    throw new Error('Sub-class to implement');
  }
}

module.exports = PaymentProcessBase;
