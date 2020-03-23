const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for meeting relayer constants.
 *
 * @class MeetingRelayerConstants
 */
class MeetingRelayerConstants {
  get availableStatus() {
    return 'AVAILABLE';
  }

  get reservedStatus() {
    return 'RESERVED';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.availableStatus,
      '2': oThis.reservedStatus,
      '3': oThis.inactiveStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new MeetingRelayerConstants();
