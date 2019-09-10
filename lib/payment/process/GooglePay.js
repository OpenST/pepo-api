const rootPrefix = '../../..',
  GoogleAuthLibrary = require('google-auth-library'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  PaymentProcessBase = require(rootPrefix + '/lib/payment/process/Base'),
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
        coreConstants.GOOGLE_INAPP_SERVICE_ACCOUNT_KEY,
        ['https://www.googleapis.com/auth/androidpublisher']
      );

    const receiptData = JSON.parse(oThis.paymentReceipt.transactionReceipt),
      url = util.format(requestUrl, receiptData.packageName, receiptData.productId, receiptData.purchaseToken);

    await authClient
      .request({ url })
      .then(async function(resp) {
        if (resp.status && resp.status == 200) {
          if (resp.data.orderId != receiptData.orderId) {
            await oThis._handleFailure('OrderId mismatch');
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
