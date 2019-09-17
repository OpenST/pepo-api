const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  PaymentProcessingFactory = require(rootPrefix + '/lib/payment/process/Factory'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  productConstant = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
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

    await oThis._fetchFiatPayment();

    // TODO Payments - check for receipt validation status
    if (processResp.isSuccess() && processResp.data.productionEnvSandboxReceipt === 0) {
      await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
        fiatPaymentId: oThis.fiatPaymentId
      });
    }

    return oThis._apiResponse();
  }

  /**
   * Validate and sanitize
   *
   * @returns {*|result}
   * @private
   */
  async _validateAndSanitize() {
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

    if (oThis.os !== productConstant.ios && oThis.os !== productConstant.android) {
      let errorObject = responseHelper.error({
        internal_error_identifier: 'invalid_os:a_s_p_pv_3',
        api_error_identifier: 'invalid_api_params',
        debug_options: { os: oThis.os }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_p_pv_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_os'],
          debug_options: { os: oThis.os }
        })
      );
    }

    // we are not validating the keys inside paymentReceipt in _validateAndSanitize
    // because Apple and Google will keep changing it.

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
      serviceReceiptId = oThis.paymentReceipt.transactionId,
      serviceKind = oThis._getServiceKind();

    let createParams = {
      receipt_id: serviceReceiptId,
      raw_receipt: JSON.stringify(oThis.paymentReceipt),
      from_user_id: oThis.currentUser.id,
      kind: fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind],
      service_kind: fiatPaymentConstants.invertedServiceKinds[serviceKind],
      currency: ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency],
      status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.receiptValidationPendingStatus]
    };
    let fiatPaymentCreateResp = await new FiatPaymentModel()
      .insert(createParams)
      .fire()
      .catch(async function(mysqlErrorObject) {
        // duplicate is handled here.
        if (mysqlErrorObject.code === mysqlErrorConstants.duplicateError) {
          oThis.isAlreadyRecorded = true;
          oThis.paymentDetail = await new FiatPaymentModel().fetchByReceiptIdAndServiceKind(
            serviceReceiptId,
            serviceKind
          );
          oThis.fiatPaymentId = oThis.paymentDetail.id;
        } else {
          let errorResp = responseHelper.error({
            internal_error_identifier: 'a_s_p_pv_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: {
              error: JSON.stringify(mysqlErrorObject),
              errorMessage: 'Could not store topup.',
              createParams: JSON.stringify(createParams)
            }
          });
          await createErrorLogsEntry.perform(errorResp, errorLogsConstants.highSeverity);
          return Promise.reject(errorResp);
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
    } else if (oThis.os === productConstant.android) {
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
