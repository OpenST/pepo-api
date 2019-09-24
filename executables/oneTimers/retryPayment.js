/**
 * retry payment.
 *
 * Usage: node ./executables/oneTimers/retryPayment.js fiatPaymentId
 *
 */

const rootPrefix = '../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  ApplePay = require(rootPrefix + '/lib/payment/process/ApplePay'),
  GooglePay = require(rootPrefix + '/lib/payment/process/GooglePay'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const fiatPaymentId = process.argv[2];

class RetryPayment {
  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    const oThis = this;

    let queryResponse = await new FiatPaymentModel()
      .select('*')
      .where({ id: fiatPaymentId })
      .fire();
    let fiatPayment = queryResponse[0];

    if (!fiatPayment) {
      return Promise.reject('fiatPayment not found. Please check in db.');
    }

    let processResp = null;
    if (fiatPayment.service_kind == fiatPaymentConstants.invertedServiceKinds[fiatPaymentConstants.applePayKind]) {
      logger.step('Reprocessing Payment on Apple Apple Apple Apple pay');
      processResp = await new ApplePay({
        paymentReceipt: JSON.parse(fiatPayment.raw_receipt),
        userId: fiatPayment.from_user_id,
        fiatPaymentId: fiatPaymentId
      }).perform();
    } else {
      logger.step('Reprocessing Payment on Google Google Google Google pay');
      processResp = await new GooglePay({
        paymentReceipt: JSON.parse(fiatPayment.raw_receipt),
        userId: fiatPayment.from_user_id,
        fiatPaymentId: fiatPaymentId
      }).perform();
    }

    console.log('--processResp---', processResp);

    if (processResp.isSuccess() && processResp.data.productionEnvSandboxReceipt === 0) {
      logger.step('Enquing job to transfer pepo.');
      await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
        fiatPaymentId: fiatPaymentId
      });
    } else {
      logger.error('Something is wrong. Please check receipt response(decrypted_receipt) in DB');
    }

    return processResp;
  }
}

const retryPaymentObj = new RetryPayment();

retryPaymentObj
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });
