const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds;

/**
 * Class for video constants
 *
 * @class VideoConstants
 */
class VideoConstants {
  get notCompressedStatus() {
    return 'NOT_COMPRESSED';
  }

  get compressionStartedStatus() {
    return 'COMPRESSION_STARTED';
  }

  get compressionDoneStatus() {
    return 'COMPRESSION_DONE';
  }

  get compressionFailedStatus() {
    return 'COMPRESSION_FAILED';
  }

  get userVideoKind() {
    return 'USER_VIDEO';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.notCompressedStatus,
      '2': oThis.compressionStartedStatus,
      '3': oThis.compressionDoneStatus,
      '4': oThis.compressionFailedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    return invertedStatuses ? invertedStatuses : util.invert(oThis.statuses);
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.userVideoKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    return invertedKinds ? invertedKinds : util.invert(oThis.kinds);
  }

  get compressionSizes() {
    const oThis = this;

    return {
      [oThis.userVideoKind]: {
        '720w': { width: 720 }
      }
    };
  }
}

module.exports = new VideoConstants();
