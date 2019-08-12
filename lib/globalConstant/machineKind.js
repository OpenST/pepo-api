/**
 * Class for machine kind constants.
 *
 * @class MachineKindConstant
 */
class MachineKindConstant {
  /**
   * Get RMQ options for machine kind.
   *
   * @param {string} machineKind
   *
   * @return {*}
   */
  rmqOptionsFor(machineKind) {
    const oThis = this;

    if (machineKind === oThis.cronKind) {
      return {
        connectionTimeoutSec: oThis.cronRmqWaitTimeout,
        switchHostAfterSec: oThis.cronRmqSwitchTimeout
      };
    } else if (machineKind === oThis.appServerKind) {
      return {
        connectionTimeoutSec: oThis.appServerRmqWaitTimeout,
        switchHostAfterSec: oThis.appServerRmqSwitchTimeout
      };
    }

    return Promise.reject(new Error('unrecognized machine kind machineKind.'));
  }

  // Machine kinds start.
  get cronKind() {
    return 'cronKind';
  }

  get appServerKind() {
    return 'appServerKind';
  }
  // Machine kinds end.

  // Connection wait timeout for app server machine.
  get appServerRmqWaitTimeout() {
    return 30;
  }

  // Connection wait timeout for cron machine.
  get cronRmqWaitTimeout() {
    return 3600;
  }

  // Connection switch timeout for app server machine.
  get appServerRmqSwitchTimeout() {
    return 5;
  }

  // Connection switch timeout for cron machine.
  get cronRmqSwitchTimeout() {
    return 5;
  }
}

module.exports = new MachineKindConstant();
