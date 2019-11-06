const rootPrefix = '../../..',
  GooglePayPaymentValidation = require(rootPrefix + '/lib/payment/Validation/GooglePay'),
  ApplePayPaymentValidation = require(rootPrefix + '/lib/payment/Validation/ApplePay'),
  productConstant = require(rootPrefix + '/lib/globalConstant/inAppProduct');

class PaymentValidationFactory {
  /**
   * Get instance of the processor class
   *
   * @param os
   * @param params
   */
  getInstance(os, params) {
    if (os == productConstant.ios) {
      return new ApplePayPaymentValidation(params);
    } else if (os == productConstant.android) {
      return new GooglePayPaymentValidation(params);
    } else {
      throw new Error('Invalid os parameter passed: ' + os);
    }
  }
}

module.exports = new PaymentValidationFactory();
