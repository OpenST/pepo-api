const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, invertedStatuses;

/**
 * Class for cron process constants.
 *
 * @class CronProcesses
 */
class CronProcesses {
  // Cron processes enum kinds start.
  get emailServiceApiCallHookProcessor() {
    return 'emailServiceApiCallHookProcessor';
  }

  get cronProcessesMonitor() {
    return 'cronProcessesMonitor';
  }

  get bgJobProcessor() {
    return 'bgJobProcessor';
  }

  get notificationJobProcessor() {
    return 'notificationJobProcessor';
  }

  get webhookJobPreProcessor() {
    return 'webhookJobPreProcessor';
  }

  get pepoMobileEventJobProcessor() {
    return 'pepoMobileEventJobProcessor';
  }

  get socketJobProcessor() {
    return 'socketJobProcessor';
  }

  get pixelJobProcessor() {
    return 'pixelJobProcessor';
  }

  get cdnCacheInvalidationProcessor() {
    return 'cdnCacheInvalidationProcessor';
  }

  get pushNotificationHookProcessor() {
    return 'pushNotificationHookProcessor';
  }

  get pushNotificationAggregator() {
    return 'pushNotificationAggregator';
  }

  get webhookProcessor() {
    return 'webhookProcessor';
  }

  get userSocketConnArchival() {
    return 'userSocketConnArchival';
  }

  get retryPendingReceiptValidation() {
    return 'retryPendingReceiptValidation';
  }

  get monitorOstEventHooks() {
    return 'monitorOstEventHooks';
  }

  get reValidateAllReceipts() {
    return 'reValidateAllReceipts';
  }
  // Cron processes enum types end.

  get populatePopularityCriteria() {
    return 'populatePopularityCriteria';
  }

  // Cron processes enum types end

  // Status enum types start
  get runningStatus() {
    return 'running';
  }

  get stoppedStatus() {
    return 'stopped';
  }

  get inactiveStatus() {
    return 'inactive';
  }
  // Status enum types end.

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.emailServiceApiCallHookProcessor,
      '2': oThis.cronProcessesMonitor,
      '3': oThis.bgJobProcessor,
      '4': oThis.notificationJobProcessor,
      '5': oThis.socketJobProcessor,
      '6': oThis.pushNotificationHookProcessor,
      '7': oThis.pushNotificationAggregator,
      '8': oThis.userSocketConnArchival,
      '9': oThis.retryPendingReceiptValidation,
      '10': oThis.pepoMobileEventJobProcessor,
      '11': oThis.reValidateAllReceipts,
      '12': oThis.cdnCacheInvalidationProcessor,
      '13': oThis.pixelJobProcessor,
      '14': oThis.monitorOstEventHooks,
      '15': oThis.populatePopularityCriteria,
      '16': oThis.webhookJobPreProcessor,
      '17': oThis.webhookProcessor
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.runningStatus,
      '2': oThis.stoppedStatus,
      '3': oThis.inactiveStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  // Restart timeouts for crons.
  get continuousCronRestartInterval() {
    return 30 * 60 * 1000;
  }

  get cronRestartInterval5Mins() {
    return 5 * 60 * 1000;
  }

  // Cron types based on running time.
  get continuousCronsType() {
    return 'continuousCrons';
  }

  get periodicCronsType() {
    return 'periodicCrons';
  }
}

module.exports = new CronProcesses();
