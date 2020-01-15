const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedCompressionStatuses, invertedStatuses, invertedKinds, videoCompressionSizes;

/**
 * Class for video constants.
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

  get externalResolution() {
    return 'external';
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

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get postVideoKind() {
    return 'POST';
  }

  get replyVideoKind() {
    return 'REPLY';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.postVideoKind,
      '2': oThis.replyVideoKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get compressionSizes() {
    const oThis = this;

    videoCompressionSizes = videoCompressionSizes
      ? videoCompressionSizes
      : {
          [oThis.postVideoKind]: {
            [oThis.internalVideoSize]: { width: 576 },
            [oThis.externalVideoSize]: { width: 576 }
          },
          [oThis.replyVideoKind]: {
            [oThis.internalVideoSize]: { width: 576 },
            [oThis.externalVideoSize]: { width: 576 }
          }
        };

    return videoCompressionSizes;
  }

  get internalVideoSize() {
    return '576wx';
  }

  get externalVideoSize() {
    return '576w';
  }
}

module.exports = new VideoConstants();
