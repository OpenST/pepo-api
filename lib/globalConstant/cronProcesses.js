/**
 * Model to get cron process and its details.
 *
 * @module /lib/globalConstant/cronProcesses
 */

/**
 * Class for cron process constants
 *
 * @class
 */
class CronProcesses {
  // Cron processes enum types start
  get hookProcesser() {
    return 'hookProcesser';
  }

  get cronProcessesMonitor() {
    return 'cronProcessesMonitor';
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
