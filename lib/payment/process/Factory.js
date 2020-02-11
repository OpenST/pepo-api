const rootPrefix = '../../..',
  ProcessApplePayPayment = require(rootPrefix + '/lib/payment/process/ApplePay'),
  ProcessGooglePayPayment = require(rootPrefix + '/lib/payment/process/GooglePay'),
  inAppProductConstants = require(rootPrefix + '/lib/globalConstant/fiat/inAppProduct');

/**
 * Class for payment processor factory.
 *
 * @class PaymentProcessFactory
 */
class PaymentProcessFactory {
  /**
   * Get instance of the processor class.
   *
   * @param {string} os
   * @param {object} params
   */
  getInstance(os, params) {
    if (os === inAppProductConstants.ios) {
      return new ProcessApplePayPayment(params);
    } else if (os === inAppProductConstants.android) {
      return new ProcessGooglePayPayment(params);
    }

    throw new Error('Invalid os parameter passed: ' + os);
  }
}

module.exports = new PaymentProcessFactory();
