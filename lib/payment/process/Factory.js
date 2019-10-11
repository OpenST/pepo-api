const rootPrefix = '../../..',
  ProcessGooglePayPayment = require(rootPrefix + '/lib/payment/process/GooglePay'),
  ProcessApplePayPayment = require(rootPrefix + '/lib/payment/process/ApplePay'),
  productConstant = require(rootPrefix + '/lib/globalConstant/inAppProduct');

class PaymentProcessFactory {
  /**
   * Get instance of the processor class
   *
   * @param os
   * @param params
   */
  getInstance(os, params) {
    if (os == productConstant.ios) {
      return new ProcessApplePayPayment(params);
    } else if (os == productConstant.android) {
      return new ProcessGooglePayPayment(params);
    } else {
      throw new Error('Invalid os parameter passed: ' + os);
    }
  }
}

module.exports = new PaymentProcessFactory();
