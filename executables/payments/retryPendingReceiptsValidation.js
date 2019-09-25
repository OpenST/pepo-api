const rootPrefix = '../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  paymentFactory = require(rootPrefix + '/lib/payment/process/Factory'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  inAppProductsConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct');

const BATCH_SIZE = 5;

class RetryPendingReceiptValidation {
  constructor() {
    const oThis = this;

    oThis.currentTimeStamp = null;
  }

  /**
   *
   */
  async perform() {
    const oThis = this;

    oThis._setCurrentTimeStamp();

    await oThis._fetchRowsAndOperate();
  }

  /**
   * SetCurrentTimestamp
   *
   * @private
   */
  _setCurrentTimeStamp() {
    const oThis = this;
    oThis.currentTimeStamp = basicHelper.getCurrentTimestampInSeconds();
  }

  /**
   * Fetch rows and operate
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchRowsAndOperate() {
    const oThis = this;

    let areRowsRemainingToProcess = true,
      promiseArray = [];

    while (areRowsRemainingToProcess) {
      let dbRows = await new FiatPaymentModel()
        .select('*')
        .where([
          'retry_after < ? AND status = ?',
          oThis.currentTimeStamp,
          fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.receiptValidationPendingStatus]
        ])
        .limit(BATCH_SIZE)
        .fire();

      if (dbRows.length === 0) {
        areRowsRemainingToProcess = false;
      } else {
        for (let i = 0; i < dbRows.length; i++) {
          let formattedRow = FiatPaymentModel.formatDbData(dbRows[i]);
          promiseArray.push(oThis._operateOnFetchedRow(formattedRow));
        }
        await Promise.all(promiseArray);
      }
    }
  }

  /**
   * Operate on fetched row
   *
   * @param dataRow
   * @returns {Promise<never>}
   * @private
   */
  async _operateOnFetchedRow(dataRow) {
    const oThis = this;

    let fiatPayment = dataRow,
      params = {
        paymentReceipt: fiatPayment.rawReceipt,
        userId: fiatPayment.userId,
        fiatPaymentId: fiatPayment.id
      },
      os = null;
    if (fiatPayment.serviceKind === fiatPaymentConstants.applePayKind) {
      os = inAppProductsConstants.ios;
    } else if (fiatPayment.serviceKind === fiatPaymentConstants.googlePayKind) {
      os = inAppProductsConstants.android;
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_p_rprv_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { reason: 'Invalid service kind' }
        })
      );
    }

    let getPaymentValidatorObj = paymentFactory.getInstance(os, params),
      paymentValidationResponse = await getPaymentValidatorObj.perform(),
      postRetryFiatPaymentDetailRsp = await oThis._fetchFiatPayment(fiatPayment.id);

    if (
      paymentValidationResponse.isSuccess() &&
      paymentValidationResponse.data.productionEnvSandboxReceipt === 0 &&
      postRetryFiatPaymentDetailRsp.isSuccess() &&
      postRetryFiatPaymentDetailRsp.data.status === fiatPaymentConstants.receiptValidationSuccessStatus
    ) {
      await bgJob.enqueue(bgJobConstants.validatePaymentReceiptJobTopic, {
        fiatPaymentId: oThis.fiatPaymentId
      });
    }
  }

  /**
   * Fetch fiat payment receipt
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchFiatPayment(fiatPaymentId) {
    const oThis = this;

    let paymentObj = await new FiatPaymentModel().fetchByIds([fiatPaymentId]),
      paymentDetail = paymentObj[fiatPaymentId];

    return responseHelper.successWithData(paymentDetail);
  }
}
