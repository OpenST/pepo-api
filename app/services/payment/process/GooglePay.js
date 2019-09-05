const rootPrefix = '../../../..',
  ProcessPaymentBase = require(rootPrefix + '/app/services/payment/process/Base'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed base.
 *
 * @class ProcessGooglePay
 */
class ProcessGooglePay extends ProcessPaymentBase {
  getServiceKind() {
    return fiatPaymentConstants.googlePayKind;
  }
}

module.exports = ProcessGooglePay;
