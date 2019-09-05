const rootPrefix = '../../../..',
  ProcessPaymentBase = require(rootPrefix + '/app/services/payment/process/Base'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest');

const url = 'https://sandbox.itunes.apple.com/verifyReceipt';

/**
 * Class for feed base.
 *
 * @class ProcessApplePay
 */
class ProcessApplePay extends ProcessPaymentBase {
  getReceiptId() {
    const oThis = this;

    return oThis.receipt.transactionId;
  }

  getServiceKind() {
    return fiatPaymentConstants.applePayKind;
  }

  async _validateRequestReceipt() {
    const oThis = this;

    let header = {
      'cache-control': 'no-cache'
    };

    let HttpLibObj = new HttpLibrary({ resource: url, header: header, noFormattingRequired: true });

    let httpResponse = await HttpLibObj.post(JSON.stringify({ 'receipt-data': oThis.receipt.transactionReceipt }));

    console.log('httpResponse------------------------', httpResponse);

    if (httpResponse.isFailure()) {
      return Promise.reject(httpResponse);
    }

    await new FiatPaymentModel.update({
      decrepted_receipt: httpResponse.data.responseData,
      status: fiatPaymentConstants.paymentConfirmedStatus()
    }).fire();

    return httpResponse;
  }
}

module.exports = ProcessApplePay;
