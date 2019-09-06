const rootPrefix = '../../../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const url = 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Class for feed base.
 *
 * @class ProcessApplePay
 */
class ProcessApplePay {
  constructor(params) {
    const oThis = this;

    oThis.currentUser = params.currentUser;
    oThis.paymentReceipt = params.paymentReceipt;
    oThis.userId = params.userId;

    oThis.receiptResponseData = null;
    oThis.product = null;
  }

  async perform() {
    const oThis = this,
      promiseArray = [];

    promiseArray.push(oThis._validateRequestReceipt());

    promiseArray.push(oThis._getProductData());

    await Promise.all(promiseArray);

    await oThis._updatePaymentStatus();

    await FiatPaymentModel.flushCache();

    return responseHelper.successWithData({});
  }

  async _validateRequestReceipt() {
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

    if (oThis.receiptResponseData.status == 21007) {
      // according to https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
      // retry on sandbox env.
    } else if (oThis.receiptResponseData.status != 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_p_p_ap_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_receipt'],
          debug_options: oThis.receiptResponseData
        })
      );
    }

    return responseHelper.successWithData({});
  }

  async _getProductData() {
    const oThis = this;

    let productsData = await new InAppProductsModel()
      .select('*')
      .where({ apple_product_id: oThis.paymentReceipt['productId'] })
      .fire();
    oThis.product = productsData[0];

    return responseHelper.successWithData({});
  }

  async _updatePaymentStatus() {
    const oThis = this;

    let quantity = 1,
      receiptResponseDataReceipts = oThis.receiptResponseData.receipt['in_app'];

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

    await new FiatPaymentModel()
      .update({
        amount: oThis.product.amount_in_usd * quantity,
        pepo_amount: oThis.product.amount_in_pepo * quantity,
        decrypted_receipt: JSON.stringify(oThis.receiptResponseData),
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.paymentConfirmedStatus]
      })
      .fire();

    return responseHelper.successWithData({});
  }
}

module.exports = ProcessApplePay;
