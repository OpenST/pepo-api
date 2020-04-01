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

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get newChannelIntervalInSec() {
    return 60 * 60 * 24 * 7; // 7 days
  }

  get trendingChannelsLimit() {
    return 20;
  }
}

module.exports = new Channels();
