const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedCompressionStatuses, invertedStatuses, invertedKinds, videoCompressionSizes;

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

  get compressionStatuses() {
    const oThis = this;

    return {
      '1': oThis.notCompressedStatus,
      '2': oThis.compressionStartedStatus,
      '3': oThis.compressionDoneStatus,
      '4': oThis.compressionFailedStatus
    };
  }

  get invertedCompressionStatuses() {
    const oThis = this;

    invertedCompressionStatuses = invertedCompressionStatuses
      ? invertedCompressionStatuses
      : util.invert(oThis.compressionStatuses);

    return invertedCompressionStatuses;
  }

  get activeStatus() {
    return 'ACTIVE';
  }

  get deletedStatus() {
    return 'DELETED';
  }

  get originalResolution() {
    return 'original';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.deletedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses ? invertedStatuses : util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get userVideoKind() {
    return 'USER_VIDEO';
  }

  get replyVideoKind() {
    return 'REPLY_VIDEO';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.userVideoKind,
      '2': oThis.replyVideoKind
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
            '576w': { width: 576 }
          },
          [oThis.replyVideoKind]: {
            '576w': { width: 576 }
          }
        };

    return videoCompressionSizes;
  }
}

module.exports = new VideoConstants();
