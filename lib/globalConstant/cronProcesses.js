/**
 * Model to get cron process and its details.
 *
 * @module /lib/globalConstant/cronProcesses
 */

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, invertedStatuses;

/**
 * Class for cron process constants
 *
 * @class
 */
class CronProcesses {
  // Cron processes enum kinds start
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

  get socketJobProcessor() {
    return 'socketJobProcessor';
  }

  get pushNotificationHookProcessor() {
    return 'pushNotificationHookProcessor';
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
  // Status enum types end

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.emailServiceApiCallHookProcessor,
      '2': oThis.cronProcessesMonitor,
      '3': oThis.bgJobProcessor,
      '4': oThis.notificationJobProcessor,
      '5': oThis.socketJobProcessor,
      '6': oThis.pushNotificationHookProcessor
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

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

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  // Restart timeouts for crons.
  get continuousCronRestartInterval() {
    return 30 * 60 * 1000;
  }

  get cronRestartInterval5Mins() {
    return 5 * 60 * 1000;
  }

  get stateRootSyncCronsRestartInterval() {
    return 10 * 60 * 1000;
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
