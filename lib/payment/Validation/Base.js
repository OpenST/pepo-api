const rootPrefix = '../../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/fiat/FiatPayment'),
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
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

    return responseHelper.successWithData({
      productionEnvSandboxReceipt: oThis.productionEnvSandboxReceipt,
      status: oThis.status
    });
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
}

module.exports = PaymentProcessBase;
