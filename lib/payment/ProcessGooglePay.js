const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed base.
 *
 * @class ProcessGooglePay
 */
class ProcessGooglePay {
  constructor(params) {
    const oThis = this;

    oThis.currentUser = params.currentUser;
    oThis.paymentReceipt = params.paymentReceipt;
    oThis.userId = params.userId;

    oThis.receiptResponseData = null;
    oThis.product = null;
  }

  async perform() {
    return responseHelper.successWithData({});
  }
}

module.exports = ProcessGooglePay;
