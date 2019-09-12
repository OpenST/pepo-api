const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  PaymentProcessingFactory = require(rootPrefix + '/lib/payment/process/Factory'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  productConstant = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  mysqlErrorConstants = require(rootPrefix + '/lib/globalConstant/mysqlErrorConstants');

class CreateTopup extends ServiceBase {
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

    oThis.isAlreadyRecorded = false;
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

    await oThis._validateAndSanitize();

    await oThis._recordTopup();

    if (oThis.isAlreadyRecorded) {
      return oThis._apiResponse();
    }

    let processResp = await oThis._serviceSpecificTasks();

    if (processResp && processResp.data.productionSandbox === 0) {
      await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
        fiatPaymentId: oThis.fiatPaymentId
      });
    }

    await oThis._fetchFiatPayment();

    return oThis._apiResponse();
  }

  /**
   * Validate and sanitize
   *
   * @returns {*|result}
   * @private
   */
  _validateAndSanitize() {
    const oThis = this;

    // checking if the logged in user is same as the userId coming in params
    if (oThis.userId != oThis.currentUser.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_p_pv_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {
            userId: oThis.userId,
            currentUserId: oThis.currentUser.id
          }
        })
      );
    }

    // TODO - payments - we should validate receipt - if invalid receipt, send pagerduty. Talk to Sunil.
    // TODO - payments - if os comes incorrectly, then we should record and send alert to dev and return error.

    return responseHelper.successWithData({});
  }

  /**
   * Insert in fiat payments
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _recordTopup() {
    const oThis = this,
      receiptId = oThis.paymentReceipt.transactionId,
      serviceKind = oThis._getServiceKind();

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
          oThis.isAlreadyRecorded = true;
          oThis.paymentDetail = await new FiatPaymentModel().fetchByReceiptIdAndServiceKind(receiptId, serviceKind);
          oThis.fiatPaymentId = oThis.paymentDetail.id;
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

    if (!oThis.isAlreadyRecorded) {
      oThis.fiatPaymentId = fiatPaymentCreateResp.insertId;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Api response
   *
   * @private
   */
  _apiResponse() {
    const oThis = this;

    return responseHelper.successWithData({ [entityType.userTopUp]: oThis.paymentDetail });
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

    let paymentProcessor = PaymentProcessingFactory.getInstance(oThis.os, params);

    return paymentProcessor.perform();
  }

  /**
   * Get service kind
   *
   * @returns {string}
   */
  _getServiceKind() {
    const oThis = this;

    if (oThis.os === productConstant.ios) {
      return fiatPaymentConstants.applePayKind;
    } else {
      return fiatPaymentConstants.googlePayKind;
    }
  }

  /**
   * Fetch fiat payment receipt
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchFiatPayment() {
    const oThis = this;

    let paymentObj = await new FiatPaymentModel().fetchByIds([oThis.fiatPaymentId]);

    oThis.paymentDetail = paymentObj[oThis.fiatPaymentId];
  }
}

module.exports = CreateTopup;
