const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, invertedStatuses;

/**
 * Class for channel video constants.
 *
 * @class ChannelVideos
 */
class ChannelVideos {
  get postKind() {
    return 'POST';
  }

  get replyKind() {
    return 'REPLY';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.postKind,
      '2': oThis.replyKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

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
}

module.exports = new ChannelVideos();
