const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for channel constants.
 *
 * @class Channels
 */
class Channels {
  get activeStatus() {
    return 'ACTIVE';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus,
      '3': oThis.deletedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get newChannelIntervalInSec() {
    return 60 * 60 * 6; // 6 hours for testing, requested by bhavik
  }

  get trendingChannelsLimit() {
    return 20;
  }
}

module.exports = new Channels();
