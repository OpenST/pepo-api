const rootPrefix = '../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed base.
 *
 * @class ValidatePaymentReceipt
 */
class ValidatePaymentReceipt {
  constructor(params) {
    const oThis = this;

    oThis.fiatPaymentId = params.fiatPaymentId;
  }

  async perform() {
    const oThis = this;

    let fiatPayments = await new FiatPaymentModel().fetchByIds([oThis.fiatPaymentId]);
    let fiatPayment = fiatPayments[oThis.fiatPaymentId];

    return responseHelper.successWithData({});
  }
}

module.exports = ValidatePaymentReceipt;
