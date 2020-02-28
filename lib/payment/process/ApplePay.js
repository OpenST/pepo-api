const rootPrefix = '../../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  PaymentProcessBase = require(rootPrefix + '/lib/payment/process/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
  inAppPurchaseConstants = require(rootPrefix + '/lib/globalConstant/inAppPurchase');

const PRODUCTION_URL = inAppPurchaseConstants.appleProductionReceiptValidationEndpoint;
const SANDBOX_URL = inAppPurchaseConstants.appleSandboxReceiptValidationEndpoint;

class ProcessApplePay extends PaymentProcessBase {
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.retryOnAppleSandbox = false;
  }

  /**
   * where condition for product
   *
   * @return {{apple_product_id: *}}
   * @private
   */
  _productWhereCondition() {
    const oThis = this;

    return { apple_product_id: oThis.paymentReceipt['productId'] };
  }

  /**
   * Validate receipt
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateReceipt() {
    const oThis = this;

    let validateResp = await oThis._validateRequestReceipt(PRODUCTION_URL);
    if (validateResp.isFailure()) {
      return validateResp;
    }

    // if Apple's production receipt comes for validation in Pepo's non production env, send pagerduty.
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

  /**
   * Validate receipt request
   *
   * @param url
   * @return {Promise<*>}
   * @private
   */
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
      return oThis._handleFailure('l_p_p_ap_5', null, httpResponse, errorLogsConstants.highSeverity);
    }

    try {
      oThis.receiptResponseData = httpResponse.data.responseData;
      oThis.receiptResponseData = JSON.parse(oThis.receiptResponseData);
    } catch (error) {
      return oThis._handleFailure('l_p_p_ap_2', null, error, errorLogsConstants.highSeverity);
    }

    //21005 - The receipt server is not currently available
    //21007 = This receipt is from the test environment, but it was sent to the production environment for verification. Send it to the test environment instead.

    //Response Code Doc: https://developer.apple.com/documentation/appstorereceipts/status
    if (oThis.receiptResponseData.status == 21007) {
      if (coreConstants.environment === 'production') {
        oThis.productionEnvSandboxReceipt = 1;
        oThis.status = fiatPaymentConstants.testPaymentStatus;
      }
      oThis.retryOnAppleSandbox = true;
    } else if (oThis.receiptResponseData.status != 0) {
      let status = null;
      //21010 - The user account cannot be found or has been deleted. This is as good as receipt validation failed.
      if (oThis.receiptResponseData.status == 21010) {
        status = fiatPaymentConstants.receiptValidationFailedStatus;
      }
      return oThis._handleFailure('l_p_p_ap_3', status, {}, errorLogsConstants.highSeverity);
    } else {
      // Don't mark success if already identified as testPayment.
      oThis.status = oThis.status || fiatPaymentConstants.receiptValidationSuccessStatus;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get purchased quantity
   *
   * @return {number}
   * @private
   *
   * receiptResponseData has all the non consumed receipts.
   * we need to filter out from this data, using product_id and transaction_id of this top-up.
   * In the filtered results, we get quantity.
   */
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
      // Converting this scenario as error now, we would not allow this order to go through.
      // For reference you can see orders placed on 28/02/2020
      return oThis._handleFailure(
        'l_p_p_ap_4',
        fiatPaymentConstants.receiptValidationFailedStatus,
        {},
        errorLogsConstants.highSeverity
      );
      // const errorObject = responseHelper.error({
      //   internal_error_identifier: 'l_p_p_ap_4',
      //   api_error_identifier: 'something_went_wrong',
      //   debug_options: {
      //     message: 'transaction id in receipt is not present in success response',
      //     fiatPaymentId: oThis.fiatPaymentId,
      //     environment: coreConstants.environment,
      //     status: oThis.status,
      //     userId: oThis.userId
      //   }
      // });
      //
      // logger.error(
      //   'URGENT :: Apple transaction id in receipt is not present in success response.',
      //   errorObject.getDebugData()
      // );
      //
      // // we are treating this case liniently. This is because Apple gave success response but
      // // transaction_id and product_id not present in the response receipts list.
      // // We just create entry in error logs.
      // createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    return quantity;
  }
}

module.exports = ProcessApplePay;
