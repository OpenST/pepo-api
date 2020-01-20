/**
 * Example: node executables/webhookProcessor.js --cronProcessId 16
 *
 * @module executables/webhookProcessor
 */

const program = require('commander');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  WebhookEventModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEvent'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  WebhookEndpointByUuidsCache = require(rootPrefix + '/lib/cacheManagement/multi/WebhookEndpointByUuids'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  sigIntConstant = require(rootPrefix + '/lib/globalConstant/sigInt'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');
logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/webhookProcessor --cronProcessId 16');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

const BATCH_SIZE = 1;

/**
 * Class for webhook Processor.
 *
 * @class WebhookProcessorExecutable
 */
class WebhookProcessorExecutable extends CronBase {
  /**
   * Constructor for webhook Processor.
   *
   * @augments CronBase
   *
   * @constructor
   */
  constructor() {
    const params = { cronProcessId: cronProcessId };

    super(params);

    const oThis = this;

    oThis.canExit = true;
  }

  /**
   * Start the executable.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    while (sigIntConstant.getSigIntStatus != 1) {
      oThis._initParams();

      await oThis._getLockedRows();

      if (oThis.lockedWebhookEvents.length === 0) {
        await basicHelper.sleep(3000);
      } else {
        await oThis._processWebhooks();
      }
    }

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Init params for current iteration
   *
   * @private
   */
  _initParams() {
    const oThis = this;

    oThis.lockedWebhookEvents = [];
    oThis.webhookEnpointMapByUuid = {};

    oThis.successWebhookEventIds = [];
    oThis.internalErrorWebhookEventIds = [];
    oThis.deletedWebhookEventIds = [];
  }

  /**
   * Get Lock on Webhook Event Rows to be processed and fetch them.
   *
   * @returns {Promise<void>}
   *
   * @sets oThis.lockedWebhookEvents
   *
   */
  async _getLockedRows() {
    const oThis = this;

    const currentTime = Math.ceil(Date.now() / 1000),
      lockId = `wp_${oThis.cronProcessId}_${Date.now()}`,
      statusToProcess = [
        webhookEventConstants.invertedStatuses[webhookEventConstants.queuedStatus],
        webhookEventConstants.invertedStatuses[webhookEventConstants.failedStatus]
      ];

    const acquireLockResponse = await new WebhookEventModel()
      .update({
        status: webhookEventConstants.invertedStatuses[webhookEventConstants.inProgressStatus],
        lock_id: lockId
      })
      .where(['execute_at <= ? and lock_id IS null ', currentTime])
      .where({ status: statusToProcess })
      .limit(BATCH_SIZE)
      .order_by('execute_at asc')
      .fire();

    if (acquireLockResponse.affectedRows === 0) {
      return;
    }

    const dbRows = await new WebhookEventModel()
      .select('*')
      .where({
        status: webhookEventConstants.invertedStatuses[webhookEventConstants.inProgressStatus],
        lock_id: lockId
      })
      .fire();

    for (let i = 0; i < dbRows.length; i++) {
      const formattedRow = new WebhookEventModel().formatDbData(dbRows[i]);
      oThis.lockedWebhookEvents.push(formattedRow);
    }
  }

  /**
   * Process webhook events in parallel.
   *
   * @private
   */
  async _processWebhooks() {
    const oThis = this;

    await oThis._fetchWebhookEndpoints();

    const promises1 = [];

    for (let i = 0; i < oThis.lockedWebhookEvents.length; i++) {
      const webhookEvent = oThis.lockedWebhookEvents[i];
      promises1.push(oThis._sendEvent(webhookEvent));
    }

    await Promise.all(promises1);

    const promises2 = [
      oThis._markWebhookEventAsSuccess(),
      oThis._markWebhookEventAsInternalFailed(),
      oThis._markWebhookEventAsDeleted()
    ];
    await Promise.all(promises2);
  }

  /**
   * Fetch Webhook Endpoints
   *
   * @returns {Promise<void>}
   *
   * @sets oThis.webhookEnpointMapByUuid
   *
   */
  async _fetchWebhookEndpoints() {
    const oThis = this;

    const webhookEndpointsUuids = [];

    for (let i = 0; i < oThis.lockedWebhookEvents.length; i++) {
      webhookEndpointsUuids.push(oThis.lockedWebhookEvents[i].webhookEndpointUuid);
    }

    const cacheResp = await new WebhookEndpointByUuidsCache({ uuids: webhookEndpointsUuids }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.webhookEnpointMapByUuid = cacheResp.data;
  }

  /**
   * Send event
   *
   * @returns {Promise<void>}
   *
   * @sets oThis.deletedWebhookEventIds, oThis.internalErrorWebhookEventIds, oThis.successWebhookEventIds
   *
   */
  async _sendEvent(webhookEvent) {
    const oThis = this;

    const webhookEndpoint = oThis.webhookEnpointMapByUuid[webhookEvent.webhookEndpointUuid];

    if (webhookEndpoint.status !== webhookEndpointConstants.invertedStatuses[webhookEndpointConstants.activeStatus]) {
      oThis.deletedWebhookEventIds.push(webhookEvent.id);
      return;
    }

    try {
      const formattedDataResp = '';

      if (formattedDataResp.isFailure) {
        oThis.internalErrorWebhookEventIds.push(webhookEvent.id);
        return;
      }

      const postEventResp = '';

      if (postEventResp.isFailure) {
        await oThis._markWebhookEventAsFailed(webhookEvent, postEventResp);
      } else {
        oThis.successWebhookEventIds.push(webhookEvent.id);
      }
    } catch (e) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'e_wp_se_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: JSON.stringify(e) }
      });

      logger.error('Error: ', errorObject.getDebugData());
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      oThis.internalErrorWebhookEventIds.push(webhookEvent.id);
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint
   *
   * @private
   */
  async _markWebhookEventAsDeleted() {
    const oThis = this;

    //Note: Do not remove lock id. index data with null lock ids will be less.
    // Discuss with aman.
    if (oThis.deletedWebhookEventIds.length > 0) {
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.deletedStatus]
        })
        .where({ id: oThis.deletedWebhookEventIds })
        .fire();
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint
   *
   * @private
   */
  async _markWebhookEventAsSuccess() {
    const oThis = this;

    //Note: Do not remove lock id. index data with null lock ids will be less.
    // Discuss with aman.
    if (oThis.successWebhookEventIds.length > 0) {
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.completedStatus]
        })
        .where({ id: oThis.successWebhookEventIds })
        .fire();
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint
   *
   * @private
   */
  async _markWebhookEventAsInternalFailed() {
    const oThis = this;

    //resend after 5 minutes
    const currentTime = Math.ceil(Date.now() / 1000),
      nextExecutionTime = currentTime + 5 * 60;

    //Note: Do not increment retry count as it is an internal error
    if (oThis.internalErrorWebhookEventIds.length > 0) {
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.failedStatus],
          execute_at: nextExecutionTime,
          lock_id: null
        })
        .where({ id: oThis.internalErrorWebhookEventIds })
        .fire();
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint
   *
   * @private
   */
  async _markWebhookEventAsFailed(webhookEvent, postEventResp) {
    const oThis = this;

    const currentTime = Math.ceil(Date.now() / 1000),
      nextExecutionTime = currentTime + webhookEventConstants.nextExecutionTimeFactor ** (webhookEvent.retryCount + 1);

    if (webhookEvent.retryCount >= webhookEventConstants.retryCount - 1) {
      //Note: Do not remove lock id. index data with null lock ids will be less.
      // Discuss with aman.
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.completelyFailedStatus],
          retry_count: webhookEvent.retryCount + 1,
          error_response: JSON.stringify(postEventResp.getDebugData())
        })
        .where({ id: webhookEvent.id })
        .fire();
    } else {
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.failedStatus],
          retry_count: webhookEvent.retryCount + 1,
          error_response: JSON.stringify(postEventResp.getDebugData()),
          lock_id: null,
          execute_at: nextExecutionTime
        })
        .where({ id: webhookEvent.id })
        .fire();
    }
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

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
    return cronProcessesConstants.webhookProcessor;
  }
}

const webhookProcessor = new WebhookProcessorExecutable({ cronProcessId: +cronProcessId });

webhookProcessor
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
