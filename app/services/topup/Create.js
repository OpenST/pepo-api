const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/fiat/FiatPayment'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paymentProcessingFactory = require(rootPrefix + '/lib/payment/process/factory'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  inAppProductConstants = require(rootPrefix + '/lib/globalConstant/fiat/inAppProduct'),
  mysqlErrorConstants = require(rootPrefix + '/lib/globalConstant/mysqlErrorConstants');

/**
 * Class to create a top-up request.
 *
 * @class CreateTopup
 */
class CreateTopup extends ServiceBase {
  /**
   * Constructor to create a top-up request.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {object} params.response
   * @param {string} params.os
   * @param {string} params.user_id
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
    oThis.retryCount = 0;
  }

  /**
   * Async perform.
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

    const processResp = await oThis._serviceSpecificTasks();

    await oThis._fetchFiatPayment();

    if (
      processResp.isSuccess() &&
      processResp.data.productionEnvSandboxReceipt === 0 &&
      oThis.paymentDetail.status === fiatPaymentConstants.receiptValidationSuccessStatus
    ) {
      await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
        fiatPaymentId: oThis.fiatPaymentId
      });
    }

    return oThis._apiResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @returns {*|result}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    // Checking if the logged in user is same as the userId coming in params.
    if (oThis.userId != oThis.currentUser.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_tu_c_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {
            userId: oThis.userId,
            currentUserId: oThis.currentUser.id
          }
        })
      );
    }

    if (oThis.os !== inAppProductConstants.ios && oThis.os !== inAppProductConstants.android) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'invalid_os:a_s_tu_c_2',
        api_error_identifier: 'invalid_api_params',
        debug_options: { os: oThis.os }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_tu_c_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_os'],
          debug_options: { os: oThis.os }
        })
      );
    }

    /*
    We are not validating the keys inside paymentReceipt in _validateAndSanitize
    because Apple and Google will keep changing it.
     */
    return responseHelper.successWithData({});
  }

  /**
   * Insert in fiat payments.
   *
   * @sets oThis.paymentDetail, oThis.fiatPaymentId, oThis.retryCount
   *
   * @returns {Promise<void>}
   * @private
   */
  async _recordTopup() {
    const oThis = this;

    const serviceReceiptId = oThis.paymentReceipt.transactionId,
      serviceKind = oThis._getServiceKind();

    const createParams = {
      receipt_id: serviceReceiptId,
      raw_receipt: JSON.stringify(oThis.paymentReceipt),
      from_user_id: oThis.currentUser.id,
      kind: fiatPaymentConstants.invertedKinds[fiatPaymentConstants.topUpKind],
      service_kind: fiatPaymentConstants.invertedServiceKinds[serviceKind],
      currency: ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency],
      status: fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.receiptValidationPendingStatus],
      retry_after: basicHelper.getCurrentTimestampInSeconds()
    };

    const fiatPaymentCreateResp = await new FiatPaymentModel()
      .insert(createParams)
      .fire()
      .catch(async function(mysqlErrorObject) {
        // Duplicate is handled here.
        if (mysqlErrorObject.code === mysqlErrorConstants.duplicateError) {
          oThis.paymentDetail = await new FiatPaymentModel().fetchByReceiptIdAndServiceKind(
            serviceReceiptId,
            serviceKind
          );
          if (!oThis._needReValidation()) {
            oThis.isAlreadyRecorded = true;
          }
          oThis.fiatPaymentId = oThis.paymentDetail.id;
          oThis.retryCount = oThis.paymentDetail.retryCount;
        } else {
          const errorResp = responseHelper.error({
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

    if (!oThis.isAlreadyRecorded && !oThis.fiatPaymentId) {
      oThis.fiatPaymentId = fiatPaymentCreateResp.insertId;
      oThis.retryCount = 0;
    }
  }

  /**
   * Checks if the receipt needs re-validation.
   *
   * @returns {boolean}
   * @private
   */
  _needReValidation() {
    const oThis = this;

    if (oThis.os === inAppProductConstants.android) {
      if (oThis.paymentDetail.status === fiatPaymentConstants.receiptValidationPendingStatus) {
        return true;
      }
    }

    return false;
  }

  /**
   * Api response.
   *
   * @returns {result}
   * @private
   */
  _apiResponse() {
    const oThis = this;

    return responseHelper.successWithData({ [entityTypeConstants.topup]: oThis.paymentDetail });
  }

  /**
   * Service specific tasks.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _serviceSpecificTasks() {
    const oThis = this;

    const params = {
      fiatPaymentId: oThis.fiatPaymentId,
      paymentReceipt: oThis.paymentReceipt,
      userId: oThis.userId,
      retryCount: oThis.retryCount
    };

    const paymentProcessor = paymentProcessingFactory.getInstance(oThis.os, params);

    return paymentProcessor.perform();
  }

  /**
   * Get service kind.
   *
   * @returns {string}
   */
  _getServiceKind() {
    const oThis = this;

    if (oThis.os === inAppProductConstants.ios) {
      return fiatPaymentConstants.applePayKind;
    } else if (oThis.os === inAppProductConstants.android) {
      return fiatPaymentConstants.googlePayKind;
    }
  }

  /**
   * Fetch fiat payment receipt.
   *
   * @sets oThis.paymentDetail
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchFiatPayment() {
    const oThis = this;

    const paymentObj = await new FiatPaymentModel().fetchByIds([oThis.fiatPaymentId]);

    oThis.paymentDetail = paymentObj[oThis.fiatPaymentId];
  }
}

module.exports = CreateTopup;
