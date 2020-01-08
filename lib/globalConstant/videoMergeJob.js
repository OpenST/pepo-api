const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses = null;

/**
 * Class for video merge job constants.
 *
 * @class VideoMergeJobConstants
 */
class VideoMergeJobConstants {
  get notMergedStatus() {
    return 'NOT_MERGED';
  }

  get mergingStartedStatus() {
    return 'MERGING_STARTED';
  }

  get mergingDoneStatus() {
    return 'MERGING_DONE';
  }

  get mergingFailedStatus() {
    return 'MERGING_FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.notMergedStatus,
      '2': oThis.mergingStartedStatus,
      '3': oThis.mergingDoneStatus,
      '4': oThis.mergingFailedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new VideoMergeJobConstants();
