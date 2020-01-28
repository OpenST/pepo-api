const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for channel video constants.
 *
 * @class ChannelVideos
 */
class ChannelVideos {
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

  get channelVideoResponseEntityKind() {
    return 'CHANNEL_VIDEOS';
  }
}

module.exports = new ChannelVideos();
