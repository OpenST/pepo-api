const rootPrefix = '../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed base.
 *
 * @class ProcessPaymentReceipt
 */
class ProcessPaymentReceipt {
  constructor(params) {
    const oThis = this;

    oThis.fiatPaymentId = params.fiatPaymentId;
  }

  async perform() {
    const oThis = this;

    let fiatPayments = await new FiatPaymentModel().fetchByIds([oThis.fiatPaymentId]);
    let fiatPayment = fiatPayments[oThis.fiatPaymentId];

    // read payment receipt according to Apple or google
    // identify user id, $ amount, productId

    // fetch product details using productId, and identify pepo amount.
    // transfer pepo to user.

    return responseHelper.successWithData({});
  }
}

module.exports = ProcessPaymentReceipt;
