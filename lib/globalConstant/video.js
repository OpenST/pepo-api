const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds, videoCompressionSizes;

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

    invertedStatuses = invertedStatuses ? invertedStatuses : util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.userVideoKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds ? invertedKinds : util.invert(oThis.kinds);

    return invertedKinds;
  }

  get compressionSizes() {
    const oThis = this;

    videoCompressionSizes = videoCompressionSizes
      ? videoCompressionSizes
      : {
          [oThis.userVideoKind]: {
            '144w': { width: 144 },
            '288w': { width: 288 },
            '576w': { width: 576 },
            '720w': { width: 720 }
          }
        };

    return videoCompressionSizes;
  }
}

module.exports = new VideoConstants();
