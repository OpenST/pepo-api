const rootPrefix = '../../..',
  PaymentProcessBase = require(rootPrefix + '/lib/payment/Validation/Base'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  inAppPurchaseConstants = require(rootPrefix + '/lib/globalConstant/inAppPurchase'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment');

const PRODUCTION_URL = inAppPurchaseConstants.appleProductionReceiptValidationEndpoint;
const SANDBOX_URL = inAppPurchaseConstants.appleSandboxReceiptValidationEndpoint;

class ApplePayValidation extends PaymentProcessBase {
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
    if (oThis.retryOnAppleSandbox) {
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
      return Promise.resolve(httpResponse);
    }

    try {
      oThis.receiptResponseData = httpResponse.data.responseData;
      oThis.receiptResponseData = JSON.parse(oThis.receiptResponseData);
    } catch (error) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_p_v_ap_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          error: JSON.stringify(error)
        }
      });
      return Promise.resolve(errorObject);
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
        oThis.status = fiatPaymentConstants.receiptValidationFailedStatus;
      }
    } else {
      // Don't mark success if already identified as testPayment.
      oThis.status = oThis.status || fiatPaymentConstants.receiptValidationSuccessStatus;
    }

    return responseHelper.successWithData({});
  }
}

module.exports = ApplePayValidation;
