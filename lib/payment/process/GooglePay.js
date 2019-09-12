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
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const requestUrl = 'https://www.googleapis.com/androidpublisher/v1.1/applications/%s/inapp/%s/purchases/%s';

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

    const receiptData = oThis.paymentReceipt.transactionReceipt,
      url = Util.format(requestUrl, receiptData.packageName, receiptData.productId, receiptData.purchaseToken);

    await authClient
      .request({ url })
      .then(async function(resp) {
        if (resp.status && resp.status === 200) {
          if (resp.data.orderId !== receiptData.orderId) {
            await oThis._handleFailure('OrderId mismatch');
          }

          if (coreConstants.environment === 'production') {
            if (resp.data.purchaseType === 0) {
              oThis.productionSandbox = 1;
              oThis.status = fiatPaymentConstants.testPaymentStatus;
            } else if (resp.data.purchaseState === 0) {
              oThis.status = fiatPaymentConstants.receiptValidationSuccessStatus;
            } else if (resp.data.purchaseState === 1) {
              oThis.status = fiatPaymentConstants.receiptValidationFailedStatus;
            } else {
              oThis.status = fiatPaymentConstants.receiptValidationPendingStatus;
            }
          } else {
            if (resp.data.purchaseState === 0 || resp.data.purchaseState === 1) {
              oThis.status = fiatPaymentConstants.receiptValidationSuccessStatus;
            } else {
              oThis.status = fiatPaymentConstants.receiptValidationPendingStatus;
            }

            if (!resp.data.hasOwnProperty('purchaseType') || resp.data.purchaseType !== 0) {
              //Alert
              const errorObject = responseHelper.error({
                internal_error_identifier: 'l_p_p_gp_1',
                api_error_identifier: 'could_not_proceed',
                debug_options: {
                  message: 'URGENT :: on pepo non-production payment initiated by Google non test account.',
                  fiatPaymentId: oThis.fiatPaymentId,
                  environment: coreConstants.environment,
                  status: oThis.status,
                  userId: oThis.userId
                }
              });
              logger.error(
                'URGENT :: on pepo non-production payment initiated by Google non test account.',
                errorObject
              );
              await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            }
          }

          if (coreConstants.environment === 'production' && resp.data.purchaseType === 0) {
            oThis.productionSandbox = 1;
            oThis.status = fiatPaymentConstants.testPaymentStatus;
          }
          if (resp.data.purchaseState === 0) {
            oThis.status = fiatPaymentConstants.receiptValidationSuccessStatus;
          } else if (resp.data.purchaseState === 1) {
            oThis.status = fiatPaymentConstants.receiptValidationFailedStatus;
          } else {
            oThis.status = fiatPaymentConstants.receiptValidationPendingStatus;
          }
          oThis.receiptResponseData = resp;
        } else {
          await oThis._handleFailure(resp);
        }
      })
      .catch(async function(error) {
        await oThis._handleFailure(error);
      });

    return responseHelper.successWithData({});
  }

  async _handleFailure(error) {
    const oThis = this;

    await oThis._markPaymentStatusFail();

    return Promise.reject(
      responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_p_p_gp_2',
        api_error_identifier: 'invalid_params',
        params_error_identifiers: ['invalid_receipt'],
        debug_options: error
      })
    );
  }

  async _fetchProductData() {
    const oThis = this;

    let productsData = await new InAppProductsModel()
      .select('*')
      .where({ google_product_id: oThis.paymentReceipt['productId'] })
      .fire();
    oThis.product = productsData[0];

    return responseHelper.successWithData({});
  }
}

module.exports = ProcessGooglePay;
