const rootPrefix = '../../..',
  PaymentProcessBase = require(rootPrefix + '/lib/payment/process/Base'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

class ProcessApplePay extends PaymentProcessBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.retryOnAppleSandbox = false;
  }

  async _validateReceipt() {
    const oThis = this;

    let validateResp = await oThis._validateRequestReceipt(PRODUCTION_URL);
    if (validateResp.isFailure()) {
      return validateResp;
    }

    if (
      coreConstants.environment !== 'production' &&
      oThis.status == fiatPaymentConstants.receiptValidationSuccessStatus
    ) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_p_p_ap_1',
        api_error_identifier: 'could_not_proceed',
        debug_options: {
          message: 'URGENT :: Apple production receipt found on pepo non-production.',
          fiatPaymentId: oThis.fiatPaymentId,
          environment: coreConstants.environment,
          status: oThis.status,
          userId: oThis.userId
        }
      });
      logger.error('URGENT :: Apple production receipt found on pepo non-production.', errorObject.getDebugData());
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    } else if (oThis.retryOnAppleSandbox) {
      // according to https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
      // retry on sandbox env.
      return oThis._validateRequestReceipt(SANDBOX_URL);
    }

    return responseHelper.successWithData({});
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
      return Promise.resolve(httpResponse);
    }

    try {
      oThis.receiptResponseData = httpResponse.data.responseData;
      oThis.receiptResponseData = JSON.parse(oThis.receiptResponseData);
    } catch (error) {
      console.log('------------httpResponse.data.responseData----------', httpResponse.data.responseData);
      return oThis._handleFailure('l_p_p_ap_2', null, error);
    }

    //21005 - The receipt server is not currently available
    //21007 = This receipt is from the test environment, but it was sent to the production environment for verification. Send it to the test environment instead.

    if (oThis.receiptResponseData.status == 21007) {
      if (coreConstants.environment === 'production') {
        oThis.productionEnvSandboxReceipt = 1;
        oThis.status = fiatPaymentConstants.testPaymentStatus;
      }
      oThis.retryOnAppleSandbox = true;
    } else if (oThis.receiptResponseData.status != 0) {
      let status = null;
      if (oThis.receiptResponseData.status == 21010) {
        status = fiatPaymentConstants.receiptValidationFailedStatus;
      }
      return oThis._handleFailure('l_p_p_ap_3', status, {});
    } else {
      // Don't mark success if already identified as testPayment.
      oThis.status = oThis.status || fiatPaymentConstants.receiptValidationSuccessStatus;
    }

    return responseHelper.successWithData({});
  }

  productWhereCondition() {
    const oThis = this;

    return { apple_product_id: oThis.paymentReceipt['productId'] };
  }

  _getPurchasedQuantity() {
    const oThis = this,
      receiptResponseDataReceipts = oThis.receiptResponseData.receipt['in_app'];

    let quantity = 1,
      isTransactionIdPresentInReceipt = false;

    for (let i = 0; i < receiptResponseDataReceipts.length; i++) {
      let prodReceipt = receiptResponseDataReceipts[i];
      if (
        prodReceipt['product_id'] == oThis.paymentReceipt['productId'] &&
        prodReceipt['transaction_id'] == oThis.paymentReceipt['transactionId']
      ) {
        quantity = prodReceipt['quantity'];
        isTransactionIdPresentInReceipt = true;
        break;
      }
    }

    if (!isTransactionIdPresentInReceipt) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_p_p_ap_4',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          message: 'transaction id in receipt is not present in success response',
          fiatPaymentId: oThis.fiatPaymentId,
          environment: coreConstants.environment,
          status: oThis.status,
          userId: oThis.userId
        }
      });
      logger.error(
        'URGENT :: Apple transaction id in receipt is not present in success response.',
        errorObject.getDebugData()
      );
      createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    return quantity;
  }
}

module.exports = ProcessApplePay;

// Retry Apple payment
// rootPrefix = '.'
// FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment')
// ApplePay = require(rootPrefix + '/lib/payment/process/ApplePay')
// bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob')
// bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob')
//
//
// fiatPaymentId = 1
// fiatPayment = null
// processResp = null
// new FiatPaymentModel().select('*').where({id: fiatPaymentId}).fire().then(function(f) {fiatPayment = f[0]})
//
// new ApplePay({'paymentReceipt': JSON.parse(fiatPayment.raw_receipt),'userId': fiatPayment.from_user_id,'fiatPaymentId':fiatPaymentId}).perform().then(function(pr) {processResp = pr})
// console.log(processResp)
//
// if (processResp.isSuccess() && processResp.data.productionEnvSandboxReceipt === 0) {
//   bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
//     fiatPaymentId: fiatPaymentId
//   }).then(console.log);
// }
