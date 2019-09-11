const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  ProcessApplePayPayment = require(rootPrefix + '/lib/payment/process/ApplePay'),
  ProcessGooglePayPayment = require(rootPrefix + '/lib/payment/process/GooglePay'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  mysqlErrorConstants = require(rootPrefix + '/lib/globalConstant/mysqlErrorConstants');

/**
 * Class for feed base.
 *
 * @class PaymentProcessValidator
 */
class PaymentProcessValidator extends ServiceBase {
  /**
   * Constructor for feed base.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {object} params.response
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.paymentReceipt = params.response;
    oThis.os = params.os;
    oThis.userId = params.user_id;

    oThis.fiatPaymentId = null;
    oThis.paymentDetail = null;
  }

  /**
   * AsyncPerform
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._insertFiatPayment();

    if (!oThis.paymentDetail) {
      await oThis._serviceSpecificTasks();

      await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
        fiatPaymentId: oThis.fiatPaymentId
      });

      await oThis._fetchFiatPayment();
    }

    return responseHelper.successWithData({ [entityType.userTopUp]: oThis.paymentDetail });
  }

  /**
   * Insert in fiat payments
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _insertFiatPayment() {
    const oThis = this,
      receiptId = oThis.paymentReceipt.transactionId,
      serviceKind = oThis.getServiceKind();

    let fiatPaymentCreateResp = await new FiatPaymentModel()
      .insert({
        from_user_id: oThis.currentUser.id,
        receipt_id: receiptId,
        raw_receipt: JSON.stringify(oThis.paymentReceipt),
        kind: fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind],
        service_kind: fiatPaymentConstants.invertedServiceKinds[serviceKind],
        currency: ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency],
        status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.receiptValidationPendingStatus]
      })
      .fire()
      .catch(async function(mysqlErrorObject) {
        if (mysqlErrorObject.code === mysqlErrorConstants.duplicateError) {
          oThis.paymentDetail = await new FiatPaymentModel().fetchByReceiptIdAndKind(receiptId, serviceKind);
        } else {
          return Promise.reject(
            responseHelper.error({
              internal_error_identifier: 'a_s_p_pv_1',
              api_error_identifier: 'something_went_wrong',
              debug_options: { error: mysqlErrorObject }
            })
          );
        }
      });

    if (!oThis.paymentDetail) {
      oThis.fiatPaymentId = fiatPaymentCreateResp.insertId;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Service specific tasks
   *
   * @returns {Promise<void>}
   * @private
   */
  async _serviceSpecificTasks() {
    const oThis = this,
      params = {
        fiatPaymentId: oThis.fiatPaymentId,
        currentUser: oThis.currentUser,
        paymentReceipt: oThis.paymentReceipt,
        userId: oThis.userId
      };

    if (oThis.os == 'ios') {
      await new ProcessApplePayPayment(params).perform();
    } else if (oThis.os == 'android') {
      await new ProcessGooglePayPayment(params).perform();
    }
  }

  /**
   * Get service kind
   *
   * @returns {string}
   */
  getServiceKind() {
    const oThis = this;

    if (oThis.os == 'ios') {
      return fiatPaymentConstants.applePayKind;
    } else if (oThis.os == 'android') {
      return fiatPaymentConstants.googlePayKind;
    }
  }

  /**
   * Fetch fiat payment receipt
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchFiatPayment() {
    const oThis = this;

    let paymentObj = await new FiatPaymentModel().fetchByIds([oThis.fiatPaymentId]);

    oThis.paymentDetail = paymentObj[oThis.fiatPaymentId];

    return responseHelper.successWithData({});
  }
}

module.exports = PaymentProcessValidator;
