const rootPrefix = '../../..',
  PaymentProcessBase = require(rootPrefix + '/lib/payment/process/Base'),
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';

class ProcessApplePay extends PaymentProcessBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.retryOnAppleSandbox = false;
  }

  async _validateReceipt() {
    const oThis = this;

    await oThis._validateRequestReceipt(productionUrl);

    if (
      coreConstants.environment !== 'production' &&
      oThis.status == fiatPaymentConstants.receiptValidationSuccessStatus
    ) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_p_ppr_1',
        api_error_identifier: 'could_not_proceed',
        debug_options: {
          message: 'URGENT :: Apple production receipt found on pepo non-production.',
          fiatPaymentId: oThis.fiatPaymentId,
          environment: coreConstants.environment,
          status: oThis.status,
          userId: oThis.userId
        }
      });
      logger.error('Topup of pepo could not be started after successful payment.', errorObject);
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    } else if (oThis.retryOnAppleSandbox) {
      // according to https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
      // retry on sandbox env.
      await oThis._validateRequestReceipt(sandboxUrl);
    }
  }

  async _validateRequestReceipt(url) {
    const oThis = this;

    let header = {
      'cache-control': 'no-cache'
    };

    let HttpLibObj = new HttpLibrary({ resource: url, header: header, noFormattingRequired: true });

    let httpResponse = await HttpLibObj.post(
      JSON.stringify({ 'receipt-data': oThis.paymentReceipt.transactionReceipt })
    );

    if (httpResponse.isFailure()) {
      return Promise.reject(httpResponse);
    }

    oThis.receiptResponseData = JSON.parse(httpResponse.data.responseData);

    //21005 - The receipt server is not currently available
    //21007 = This receipt is from the test environment, but it was sent to the production environment for verification. Send it to the test environment instead.

    if (oThis.receiptResponseData.status == 21007) {
      if (coreConstants.environment === 'production') {
        oThis.productionSandbox = 1;
        oThis.status = fiatPaymentConstants.testPaymentStatus;
      }
      oThis.retryOnAppleSandbox = true;
    } else if (oThis.receiptResponseData.status != 0) {
      oThis.status = fiatPaymentConstants.receiptValidationFailedStatus;
      await oThis._markPaymentStatusFail();

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_p_p_ap_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_receipt'],
          debug_options: oThis.receiptResponseData
        })
      );
    } else {
      // Don't mark success if already identified as testPayment.
      oThis.status = oThis.status || fiatPaymentConstants.receiptValidationSuccessStatus;
    }

    return responseHelper.successWithData({});
  }

  async _fetchProductData() {
    const oThis = this;

    let productsData = await new InAppProductsModel()
      .select('*')
      .where({ apple_product_id: oThis.paymentReceipt['productId'] })
      .fire();
    oThis.product = productsData[0];

    return responseHelper.successWithData({});
  }

  _getPurchasedQuantity() {
    const oThis = this,
      receiptResponseDataReceipts = oThis.receiptResponseData.receipt['in_app'];

    let quantity = 1;

    for (let i = 0; i < receiptResponseDataReceipts.length; i++) {
      let prodReceipt = receiptResponseDataReceipts[i];
      if (
        prodReceipt['product_id'] == oThis.paymentReceipt['productId'] &&
        prodReceipt['transaction_id'] == oThis.paymentReceipt['transactionId']
      ) {
        quantity = prodReceipt['quantity'];

        break;
      }
    }

    return quantity;
  }
}

module.exports = ProcessApplePay;
