const Util = require('util'),
  GoogleAuthLibrary = require('google-auth-library');

const rootPrefix = '../../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  PaymentProcessBase = require(rootPrefix + '/lib/payment/process/Base'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  inAppPurchaseConstants = require(rootPrefix + '/lib/globalConstant/inAppPurchase'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment');

const REQUEST_URL = inAppPurchaseConstants.googleReceiptValidationRequestUrl;

class ProcessGooglePay extends PaymentProcessBase {
  constructor(params) {
    super(params);
  }

  /**
   * where condition for product
   *
   * @return {{google_product_id: *}}
   * @private
   */
  _productWhereCondition() {
    const oThis = this;

    return { google_product_id: oThis.paymentReceipt['productId'] };
  }

  /**
   * Validate receipt
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateReceipt() {
    const oThis = this,
      authClient = new GoogleAuthLibrary.JWT(
        inAppPurchaseConstants.googleInAppServiceAccountEmail,
        null,
        unescape(inAppPurchaseConstants.googleInAppServiceAccountKey),
        [inAppPurchaseConstants.googleAndroidPublisherScopeEndpoint]
      );

    let receiptData = oThis.paymentReceipt.transactionReceipt;

    if (typeof receiptData == 'string') {
      try {
        receiptData = JSON.parse(receiptData);
      } catch (error) {
        return oThis._handleFailure('l_p_p_gp_1', null, error, errorLogsConstants.highSeverity);
      }
    }
    let url = Util.format(REQUEST_URL, receiptData.packageName, receiptData.productId, receiptData.purchaseToken);

    return authClient
      .request({ url })
      .then(async function(resp) {
        oThis.receiptResponseData = resp;

        // response status should be 200, else error out.
        if (!(resp.status && resp.status === 200)) {
          return oThis._handleFailure('l_p_p_gp_4', null, resp, errorLogsConstants.highSeverity);
        }

        // validate order id. if mis-match error out
        if (resp.data.orderId !== receiptData.orderId) {
          return oThis._handleFailure('l_p_p_gp_2', null, 'OrderId mismatch', errorLogsConstants.highSeverity);
        }

        // according to https://developers.google.com/android-publisher/api-ref/purchases/products,
        // purchaseType => 0 -> Test, 1 -> Promo, 2 -> Rewarded

        if (resp.data.hasOwnProperty('purchaseType')) {
          let purchaseType = resp.data.purchaseType;

          if (purchaseType != 0) {
            const errorObject = responseHelper.error({
              internal_error_identifier: 'Unknown_Purchase_Type:l_p_p_gp_11',
              api_error_identifier: 'something_went_wrong',
              debug_options: {
                fiatPaymentId: oThis.fiatPaymentId,
                environment: coreConstants.environment,
                purchaseType: purchaseType,
                userId: oThis.userId
              }
            });
            await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            return oThis._handleFailure('l_p_p_gp_11', null, resp);
          }

          // code reaches here only for test orders
          // if Google's sandbox receipt in Pepo's production environment, mark as test payment status
          if (coreConstants.environment === 'production') {
            oThis.productionEnvSandboxReceipt = 1;
            oThis.status = fiatPaymentConstants.testPaymentStatus;
            return responseHelper.successWithData({});
          }
        } else {
          // if google production order and non production Pepo, then alert
          if (coreConstants.environment !== 'production') {
            //Alert
            const errorObject = responseHelper.error({
              internal_error_identifier: 'nonTestOnStaging:l_p_p_gp_3',
              api_error_identifier: 'could_not_proceed',
              debug_options: {
                message: 'URGENT :: on pepo non-production payment initiated by Google non test account.',
                fiatPaymentId: oThis.fiatPaymentId,
                environment: coreConstants.environment,
                userId: oThis.userId
              }
            });
            logger.error(
              'URGENT :: on pepo non-production payment initiated by Google non test account.',
              errorObject.getDebugData()
            );
            await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
          }
        }

        // according to https://developers.google.com/android-publisher/api-ref/purchases/products,
        // purchaseState => 0 -> Purchased, 1 -> Canceled, 2 -> Pending
        let purchaseState = resp.data.purchaseState;

        if (purchaseState == 0) {
          oThis.status = fiatPaymentConstants.receiptValidationSuccessStatus;
        } else if (purchaseState == 1) {
          oThis.status = fiatPaymentConstants.receiptValidationCancelledStatus;
          return oThis._handleFailure('l_p_p_gp_9', oThis.status, {}, errorLogsConstants.mediumSeverity);
        } else {
          oThis.status = fiatPaymentConstants.receiptValidationPendingStatus;
          return oThis._handleFailure('l_p_p_gp_8', oThis.status, {});
        }

        return responseHelper.successWithData({});
      })
      .catch(async function(error) {
        return oThis._handleFailure('l_p_p_gp_5', null, error, errorLogsConstants.highSeverity);
      });
  }

  /**
   * Get purchase quantity.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getPurchasedQuantity() {
    return responseHelper.successWithData({ quantity: 1 });
  }
}

module.exports = ProcessGooglePay;
