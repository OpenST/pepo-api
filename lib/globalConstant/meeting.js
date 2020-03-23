const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for meeting constants.
 *
 * @class MeetingConstants
 */
class MeetingConstants {
  get waitingStatus() {
    return 'WAITING';
  }

  get startedStatus() {
    return 'STARTED';
  }

  get endedStatus() {
    return 'ENDED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.waitingStatus,
      '2': oThis.startedStatus,
      '3': oThis.endedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new MeetingConstants();
