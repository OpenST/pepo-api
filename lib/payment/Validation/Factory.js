const rootPrefix = '../../..',
  ApplePayPaymentValidation = require(rootPrefix + '/lib/payment/Validation/ApplePay'),
  GooglePayPaymentValidation = require(rootPrefix + '/lib/payment/Validation/GooglePay'),
  inAppProductConstants = require(rootPrefix + '/lib/globalConstant/fiat/inAppProduct');

/**
 * Class for payment validation factory.
 *
 * @class PaymentValidationFactory
 */
class PaymentValidationFactory {
  /**
   * Get instance of the processor class.
   *
   * @param {string} os
   * @param {object} params
   */
  getInstance(os, params) {
    if (os === inAppProductConstants.ios) {
      return new ApplePayPaymentValidation(params);
    } else if (os === inAppProductConstants.android) {
      return new GooglePayPaymentValidation(params);
    }
    throw new Error('Invalid os parameter passed: ' + os);
  }
}

module.exports = new PaymentValidationFactory();
