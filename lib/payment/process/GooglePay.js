/**
 * Google receipt reference doc:  https://developers.google.com/android-publisher/api-ref/purchases/products
 *
 * @type {module:util}
 */

const Util = require('util');

const rootPrefix = '../../..',
  GoogleAuthLibrary = require('google-auth-library'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  PaymentProcessBase = require(rootPrefix + '/lib/payment/process/Base'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment');

const REQUEST_URL = 'https://www.googleapis.com/androidpublisher/v1.1/applications/%s/inapp/%s/purchases/%s';

class ProcessGooglePay extends PaymentProcessBase {
  constructor(params) {
    super(params);
  }

  async _validateReceipt() {
    const oThis = this,
      authClient = new GoogleAuthLibrary.JWT(
        coreConstants.GOOGLE_INAPP_SERVICE_ACCOUNT_EMAIL,
        null,
        unescape(coreConstants.GOOGLE_INAPP_SERVICE_ACCOUNT_KEY),
        ['https://www.googleapis.com/auth/androidpublisher']
      );

    let receiptData = oThis.paymentReceipt.transactionReceipt;

    if (typeof receiptData == 'string') {
      try {
        receiptData = JSON.parse(receiptData);
      } catch (error) {
        return oThis._handleFailure('l_p_p_gp_1', null, error);
      }
    }
    let url = Util.format(REQUEST_URL, receiptData.packageName, receiptData.productId, receiptData.purchaseToken);

    return authClient
      .request({ url })
      .then(async function(resp) {
        oThis.receiptResponseData = resp;
        if (resp.status && resp.status === 200) {
          if (resp.data.orderId !== receiptData.orderId) {
            return oThis._handleFailure('l_p_p_gp_2', null, 'OrderId mismatch');
          }

          // according to https://developers.google.com/android-publisher/api-ref/purchases/products,
          // purchaseType => 0 -> Test, 1 -> Promo, 2 -> Rewarded
          // purchaseState => 0 -> Purchased, 1 -> Canceled, 2 -> Pending
          if (coreConstants.environment === 'production') {
            if (resp.data.purchaseType === 0) {
              oThis.productionEnvSandboxReceipt = 1;
              oThis.status = fiatPaymentConstants.testPaymentStatus;
            } else if (resp.data.purchaseState === 0) {
              oThis.status = fiatPaymentConstants.receiptValidationSuccessStatus;
            } else if (resp.data.purchaseState === 1) {
              oThis.status = fiatPaymentConstants.receiptValidationFailedStatus;
              return oThis._handleFailure('l_p_p_gp_6', oThis.status, {});
            } else if (resp.data.purchaseState === 2) {
              oThis.status = fiatPaymentConstants.receiptValidationPendingStatus;
              return oThis._handleFailure('l_p_p_gp_7', oThis.status, {});
            }
          } else {
            //If somehow google's non-test(real) receipt is being validated on pepo's non prod env, send alert to devs.
            if (!resp.data.hasOwnProperty('purchaseType') || resp.data.purchaseType !== 0) {
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

            //Following checks are for non production environment
            if (resp.data.purchaseState === 0 || resp.data.purchaseState === 1) {
              oThis.status = fiatPaymentConstants.receiptValidationSuccessStatus;
            } else {
              oThis.status = fiatPaymentConstants.receiptValidationPendingStatus;
              return oThis._handleFailure('l_p_p_gp_8', oThis.status, {});
            }
          }

          return responseHelper.successWithData({});
        } else {
          return oThis._handleFailure('l_p_p_gp_4', null, resp);
        }
      })
      .catch(async function(error) {
        return oThis._handleFailure('l_p_p_gp_5', null, error);
      });
  }

  productWhereCondition() {
    const oThis = this;

    return { google_product_id: oThis.paymentReceipt['productId'] };
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
}

module.exports = ProcessGooglePay;
