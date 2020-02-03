const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses = null;

/**
 * Class for admin activity related logs.
 *
 * @class AggregatedNotifications
 */
class AggregatedNotifications {
  get pendingStatus() {
    return 'PENDING';
  }

  get sentStatus() {
    return 'SENT';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get maxActorCount() {
    return 100;
  }

  get defaultTimeToSendInSeconds() {
    return 19 * 60 * 60; // 19:00 time
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.sentStatus,
      '3': oThis.inactiveStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new AggregatedNotifications();
