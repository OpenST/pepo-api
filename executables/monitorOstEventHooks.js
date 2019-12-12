const program = require('commander');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  OstEventModel = require(rootPrefix + '/app/models/mysql/OstEvent'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

const BATCH_SIZE = 25;

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/monitorOstEventHooks.js --cronProcessId 42');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

class MonitorOstEventHooks extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.currentTimeStamp = null;
    oThis.canExit = true;
    oThis.ostEventIds = [];
    oThis.transactionIds = [];
  }

  async _start() {
    const oThis = this;

    oThis._setCurrentTimeStamp();

    oThis.canExit = false;

    await oThis._performBatch();

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
    return cronProcessesConstants.monitorOstEventHooks;
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
   * Perform Batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    let offset = 0;
    while (true) {
      let batchOstEventRecordsLength = await oThis._fetchOstEventsForBatch(BATCH_SIZE, offset);
      // No more ost events records present to process
      if (batchOstEventRecordsLength < BATCH_SIZE) {
        break;
      }

      offset = offset + 25;
    }

    offset = 0;
    while (true) {
      let batchTxRecordsLength = await oThis._fetchTransactionsForBatch(BATCH_SIZE, offset);
      // No more transactions records present to process
      if (batchTxRecordsLength < BATCH_SIZE) {
        break;
      }

      offset = offset + 25;
    }

    if (oThis.transactionIds.length > 0 || oThis.ostEventIds.length > 0) {
      await oThis._createErrorLogEntry();
    }
  }

  /**
   * Fetch ost Events
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstEventsForBatch(limit, offset) {
    const oThis = this;

    let notAllowedStatus = [
        ostEventConstants.invertedStatuses[ostEventConstants.failedStatus],
        ostEventConstants.invertedStatuses[ostEventConstants.doneStatus]
      ],
      last2hour30MinutesTimestamp = oThis.currentTimeStamp - (2 * 60 * 60 + 30 * 60),
      last30MinutesTimestamp = oThis.currentTimeStamp - 30 * 60;

    let ostEventRecords = await new OstEventModel()
      .select('*')
      .where(['status NOT IN (?)', notAllowedStatus])
      .where(['updated_at > (?)', last2hour30MinutesTimestamp])
      .where(['updated_at < (?)', last30MinutesTimestamp])
      .limit(limit)
      .offset(offset)
      .fire();

    let batchOstEventRecordsLength = ostEventRecords.length;

    for (let index = 0; index < batchOstEventRecordsLength; index++) {
      let ostEventRow = ostEventRecords[index];
      oThis.ostEventIds.push(ostEventRow.id);
    }

    return batchOstEventRecordsLength;
  }

  /**
   * Fetch transactions
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTransactionsForBatch(limit, offset) {
    const oThis = this;

    let notAllowedStatus = [
        transactionConstants.invertedStatuses[transactionConstants.failedStatus],
        transactionConstants.invertedStatuses[transactionConstants.doneStatus]
      ],
      last2hour30MinutesTimestamp = oThis.currentTimeStamp - (2 * 60 * 60 + 30 * 60),
      last30MinutesTimestamp = oThis.currentTimeStamp - 30 * 60;

    let transactionRecords = await new TransactionModel()
      .select('*')
      .where(['status NOT IN (?)', notAllowedStatus])
      .where(['updated_at > (?)', last2hour30MinutesTimestamp])
      .where(['updated_at < (?)', last30MinutesTimestamp])
      .limit(limit)
      .offset(offset)
      .fire();

    let batchTxRecordsLength = transactionRecords.length;

    for (let index = 0; index < batchTxRecordsLength; index++) {
      let transactionRow = transactionRecords[index];
      oThis.transactionIds.push(transactionRow.id);
    }

    return batchTxRecordsLength;
  }

  /**
   * Create error log entry
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createErrorLogEntry() {
    const oThis = this;

    const errorObject = responseHelper.error({
      internal_error_identifier: 'e_pt_1',
      api_error_identifier: 'pending_transaction_found',
      debug_options: {
        Reason: 'Pending Transaction Found In OstEvents and Transaction Table',
        ostEventIds: oThis.ostEventIds,
        transactionIds: oThis.transactionIds
      }
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);
  }
}

const monitorOstEventHooks = new MonitorOstEventHooks({ cronProcessId: +cronProcessId });

monitorOstEventHooks
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
