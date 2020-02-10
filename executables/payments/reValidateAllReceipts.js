const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/fiat/FiatPayment'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  paymentValidationFactory = require(rootPrefix + '/lib/payment/Validation/Factory'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiat/fiatPayment'),
  inAppProductConstants = require(rootPrefix + '/lib/globalConstant/fiat/inAppProduct'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

const BATCH_SIZE = 10;

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/payments/reValidateAllReceipts.js --cronProcessId 40');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

class ReValidateAllReceipts extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.currentTimeStamp = null;
    oThis.canExit = true;
  }

  async _start() {
    const oThis = this;

    oThis._setTimeStamps();

    oThis.canExit = false;

    await oThis._fetchRowsAndOperate();

    oThis.canExit = true;

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

    // Once sigint is received we will not process the next batch of rows.
    oThis.areRowsRemainingToProcess = false;

    return oThis.canExit;
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.reValidateAllReceipts;
  }

  /**
   * SetCurrentTimestamp
   *
   * @private
   */
  _setTimeStamps() {
    const oThis = this;
    oThis.before30daysTimestamp = basicHelper.getCurrentTimestampInSeconds() - 30 * 24 * 60 * 60;
    oThis.before1dayTimestamp = basicHelper.getCurrentTimestampInSeconds() - 24 * 60 * 60;
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
    const promiseArray = [];

    let page = 0;

    while (oThis.areRowsRemainingToProcess) {
      const offset = page * BATCH_SIZE,
        dbRows = await new FiatPaymentModel()
          .select('*')
          .where(['created_at > ? AND created_at < ?', oThis.before30daysTimestamp, oThis.before1dayTimestamp])
          .limit(BATCH_SIZE)
          .offset(offset)
          .fire();

      page++;

      if (dbRows.length === 0) {
        oThis.areRowsRemainingToProcess = false;
      } else {
        for (let index = 0; index < dbRows.length; index++) {
          logger.log('Operation initiated for payment id: ', dbRows[index].id);
          const formattedRow = new FiatPaymentModel().formatDbData(dbRows[index]);
          promiseArray.push(oThis._operateOnFetchedRow(formattedRow));
        }
        await Promise.all(promiseArray);
        await basicHelper.sleep(5000); // Sleeping for sometime after one batch.
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

    const fiatPayment = dataRow,
      params = {
        paymentReceipt: fiatPayment.rawReceipt,
        userId: fiatPayment.fromUserId,
        fiatPaymentId: fiatPayment.id,
        retryCount: fiatPayment.retryCount
      };

    let os = null;
    if (fiatPayment.serviceKind === fiatPaymentConstants.applePayKind) {
      os = inAppProductConstants.ios;
    } else if (fiatPayment.serviceKind === fiatPaymentConstants.googlePayKind) {
      os = inAppProductConstants.android;
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_p_rvar_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { reason: 'Invalid service kind' }
        })
      );
    }

    const getPaymentValidatorObj = paymentValidationFactory.getInstance(os, params),
      paymentValidationResponse = await getPaymentValidatorObj.perform();

    if (paymentValidationResponse.isFailure()) {
      // There was some error in api call. Actual status of receipt was not determined.
      // Thus returning from here with resolve.
      logger.log('There was some error on revalidation for payment id: ', dataRow.id);

      return Promise.resolve();
    }

    logger.log('Revalidation status for payment id: ', dataRow.id, ' is: ', paymentValidationResponse.data.status);
    if (
      paymentValidationResponse.data.status === fiatPaymentConstants.receiptValidationFailedStatus ||
      paymentValidationResponse.data.status === fiatPaymentConstants.receiptValidationCancelledStatus
    ) {
      if (
        dataRow.status !== fiatPaymentConstants.receiptValidationFailedStatus &&
        dataRow.status !== fiatPaymentConstants.receiptValidationCancelledStatus
      ) {
        // Fire pager duty.
        await oThis._firePagerDuty(dataRow, paymentValidationResponse.data.status);
      }
    } else if (paymentValidationResponse.data.status === fiatPaymentConstants.receiptValidationSuccessStatus) {
      if (dataRow.status !== fiatPaymentConstants.pepoTransferSuccessStatus) {
        // Fire pager duty.
        await oThis._firePagerDuty(dataRow, paymentValidationResponse.data.status);
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch fiat payment receipt
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchFiatPayment(fiatPaymentId) {
    const paymentObj = await new FiatPaymentModel().fetchByIds([fiatPaymentId]),
      paymentDetail = paymentObj[fiatPaymentId];

    return responseHelper.successWithData(paymentDetail);
  }

  /**
   * This function fires pager duty.
   *
   * @param {object} dataRow
   * @param {string} statusAfterRevalidation
   *
   * @returns {Promise<void>}
   * @private
   */
  async _firePagerDuty(dataRow, statusAfterRevalidation) {
    const errorObject = responseHelper.error({
      internal_error_identifier: 'Receipt_status_changed_on_revalidation:e_p_rvar_2',
      api_error_identifier: 'something_went_wrong',
      debug_options: {
        reason: 'On revalidation of the receipt status changes. Manual verification needed.',
        dbRow: JSON.stringify(dataRow),
        statusAfterRevalidation: statusAfterRevalidation
      }
    });

    logger.error('Error: ', errorObject.getDebugData());
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
  }
}

const reValidateAllReceipts = new ReValidateAllReceipts({ cronProcessId: +cronProcessId });

reValidateAllReceipts
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
