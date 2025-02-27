/**
 * Example: node executables/webhookProcessor.js --cronProcessId 16
 *
 * @module executables/webhookProcessor
 */

const program = require('commander');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  PublishWebhookLib = require(rootPrefix + '/lib/webhook/PublishWebhook'),
  WebhookEventModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEvent'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses'),
  WebhookEndpointByUuidsCache = require(rootPrefix + '/lib/cacheManagement/multi/WebhookEndpointByUuids'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  sigIntConstants = require(rootPrefix + '/lib/globalConstant/sigInt'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  webhookProcessorfactory = require(rootPrefix + '/lib/webhook/processor/factory'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent'),
  webhookEndpointConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEndpoint');

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
 * Class for webhook processor.
 *
 * @class WebhookProcessorExecutable
 */
class WebhookProcessorExecutable extends CronBase {
  /**
   * Constructor for webhook processor.
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
   * @sets oThis.canExit
   *
   * @returns {Promise<any>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    while (sigIntConstants.getSigIntStatus != 1) {
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
   * Init params for current iteration.
   *
   * @sets oThis.lockedWebhookEvents, oThis.webhookEnpointMapByUuid, oThis.successWebhookEventIds
   * @sets oThis.internalErrorWebhookEventIds, oThis.internalErrorMaxLimitWebhookEventIds, oThis.deletedWebhookEventIds
   *
   * @private
   */
  _initParams() {
    const oThis = this;

    oThis.lockedWebhookEvents = [];
    oThis.webhookEnpointMapByUuid = {};

    oThis.successWebhookEventIds = [];
    oThis.internalErrorWebhookEventIds = [];
    oThis.internalErrorMaxLimitWebhookEventIds = [];
    oThis.deletedWebhookEventIds = [];
  }

  /**
   * Get lock on webhook event rows to be processed and fetch them.
   *
   * @sets oThis.lockedWebhookEvents
   *
   * @returns {Promise<void>}
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

    oThis.lockedWebhookEvents = await new WebhookEventModel().getLockedRows({ lockId: lockId });
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

    for (let index = 0; index < oThis.lockedWebhookEvents.length; index++) {
      const webhookEvent = oThis.lockedWebhookEvents[index];
      promises1.push(oThis._sendEvent(webhookEvent));
    }

    await Promise.all(promises1);

    const promises2 = [
      oThis._markWebhookEventAsSuccess(),
      oThis._markWebhookEventAsInternalFailed(),
      oThis._markWebhookEventAsInternalCompletelyFailed(),
      oThis._markWebhookEventAsDeleted()
    ];
    await Promise.all(promises2);
  }

  /**
   * Fetch webhook endpoints.
   *
   * @sets oThis.webhookEnpointMapByUuid
   *
   * @returns {Promise<void>}
   */
  async _fetchWebhookEndpoints() {
    const oThis = this;

    const webhookEndpointsUuids = [];

    for (let index = 0; index < oThis.lockedWebhookEvents.length; index++) {
      webhookEndpointsUuids.push(oThis.lockedWebhookEvents[index].webhookEndpointUuid);
    }

    const cacheResp = await new WebhookEndpointByUuidsCache({ uuids: webhookEndpointsUuids }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.webhookEnpointMapByUuid = cacheResp.data;
  }

  /**
   * Send event.
   *
   * @sets oThis.deletedWebhookEventIds, oThis.internalErrorWebhookEventIds, oThis.internalErrorMaxLimitWebhookEventIds
   * @sets oThis.successWebhookEventIds
   *
   * @returns {Promise<void>}
   */
  async _sendEvent(webhookEvent) {
    const oThis = this;

    const webhookEndpoint = oThis.webhookEnpointMapByUuid[webhookEvent.webhookEndpointUuid];

    if (webhookEndpoint.status !== webhookEndpointConstants.activeStatus) {
      oThis.deletedWebhookEventIds.push(webhookEvent.id);

      return;
    }

    try {
      const processParams = {
        webhookEvent: webhookEvent,
        webhookEndpoint: webhookEndpoint
      };

      const formattedDataResp = await webhookProcessorfactory.perform(processParams);

      logger.debug(`formattedDataResp success: ${!formattedDataResp.isFailure()}  data: `, formattedDataResp.data);

      if (formattedDataResp.isFailure()) {
        if (webhookEvent.internalErrorCount >= webhookEventConstants.maxInternalErrorCount - 1) {
          oThis.internalErrorMaxLimitWebhookEventIds.push(webhookEvent.id);
        } else {
          oThis.internalErrorWebhookEventIds.push(webhookEvent.id);
        }

        return;
      }

      const formattedEventData = formattedDataResp.data;

      const postParams = {
        formattedParams: formattedEventData,
        webhookEndpoint: webhookEndpoint
      };

      const postEventResp = await new PublishWebhookLib(postParams).perform();

      if (postEventResp.isFailure()) {
        await oThis._markWebhookEventAsFailed(webhookEvent, postEventResp);
      } else {
        oThis.successWebhookEventIds.push(webhookEvent.id);
      }
    } catch (err) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'e_wp_se_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: JSON.stringify(err), stack: err.stack }
      });

      logger.error('Error: ', JSON.stringify(errorObject));

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);

      if (webhookEvent.internalErrorCount >= webhookEventConstants.maxInternalErrorCount - 1) {
        oThis.internalErrorMaxLimitWebhookEventIds.push(webhookEvent.id);
      } else {
        oThis.internalErrorWebhookEventIds.push(webhookEvent.id);
      }
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markWebhookEventAsDeleted() {
    const oThis = this;

    // Note: Do not remove lock id. Index data with null lock ids will be less.
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
   * Mark event failure due to error in post api call to endpoint.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markWebhookEventAsSuccess() {
    const oThis = this;

    // Note: Do not remove lock id. index data with null lock ids will be less.
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
   * Mark event failure due to error in post api call to endpoint.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markWebhookEventAsInternalCompletelyFailed() {
    const oThis = this;

    // If internal_error_count > limit, then mark as completely failed
    if (oThis.internalErrorMaxLimitWebhookEventIds.length > 0) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'e_wp_mweaicf_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          reason: 'IMPORTANT: Webhooks has reached its max internal limit.',
          webhook_event_ids: oThis.internalErrorMaxLimitWebhookEventIds
        }
      });

      logger.error('Error: ', errorObject.getDebugData());
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.completelyFailedStatus]
        })
        .update('internal_error_count = internal_error_count + 1')
        .where({ id: oThis.internalErrorMaxLimitWebhookEventIds })
        .fire();
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markWebhookEventAsInternalFailed() {
    const oThis = this;

    const currentTime = Math.ceil(Date.now() / 1000);

    // Note: Do not increment retry count as it is an internal error.
    if (oThis.internalErrorWebhookEventIds.length > 0) {
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.failedStatus],
          lock_id: null
        })
        .update(
          `internal_error_count = internal_error_count + 1,  
                  execute_at= ${currentTime} + (300 * internal_error_count)`
        )
        .where({ id: oThis.internalErrorWebhookEventIds })
        .fire();
    }
  }

  /**
   * Mark event failure due to error in post api call to endpoint.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markWebhookEventAsFailed(webhookEvent, postEventResp) {
    // Mark internal_error_count as 0 since it was tried once.
    if (webhookEvent.retryCount >= webhookEventConstants.maxRetryCount - 1) {
      // Note: Do not remove lock id. Index data with null lock ids will be less.
      // Discuss with aman.
      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.completelyFailedStatus],
          retry_count: webhookEvent.retryCount + 1,
          internal_error_count: 0,
          error_response: JSON.stringify(postEventResp.getDebugData())
        })
        .where({ id: webhookEvent.id })
        .fire();
    } else {
      const currentTime = Math.ceil(Date.now() / 1000),
        nextExecutionTime =
          currentTime + webhookEventConstants.nextExecutionTimeFactor ** (webhookEvent.retryCount + 1) * 60;

      await new WebhookEventModel()
        .update({
          status: webhookEventConstants.invertedStatuses[webhookEventConstants.failedStatus],
          retry_count: webhookEvent.retryCount + 1,
          internal_error_count: 0,
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

new WebhookProcessorExecutable({ cronProcessId: +cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
