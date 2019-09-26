const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  paymentFactory = require(rootPrefix + '/lib/payment/process/Factory'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  inAppProductsConstants = require(rootPrefix + '/lib/globalConstant/inAppProduct'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

const BATCH_SIZE = 5;

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/payments/retryPendingReceiptsValidation.js --cronProcessId 9');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

class RetryPendingReceiptValidation extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.currentTimeStamp = null;
    oThis.canExit = true;
  }

  async _start() {
    const oThis = this;

    oThis._setCurrentTimeStamp();

    await oThis._fetchRowsAndOperate();

    return responseHelper.successWithData({});
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    //Once sigint is received we will not process the next batch of rows.
    oThis.areRowsRemainingToProcess = false;
    return oThis.canExit;
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {}

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.retryPendingReceiptValidation;
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

    oThis.areRowsRemainingToProcess = true;
    let promiseArray = [];

    while (oThis.areRowsRemainingToProcess) {
      oThis.canExit = false;
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
        oThis.areRowsRemainingToProcess = false;
      } else {
        for (let i = 0; i < dbRows.length; i++) {
          let formattedRow = new FiatPaymentModel().formatDbData(dbRows[i]);
          promiseArray.push(oThis._operateOnFetchedRow(formattedRow));
        }
        await Promise.all(promiseArray);
        oThis.canExit = true;
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
        fiatPaymentId: fiatPayment.id,
        retryCount: fiatPayment.retryCount
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

const retryPendingReceiptValidation = new RetryPendingReceiptValidation({ cronProcessId: +cronProcessId });

retryPendingReceiptValidation
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Cron last run at: ', Date.now());
    process.emit('SIGINT');
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });
