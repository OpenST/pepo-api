const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses = null;

/**
 * Class for video merge job constants.
 *
 * @class VideoMergeJobConstants
 */
class VideoMergeJobConstants {
  get notStartedStatus() {
    return 'NOT_STARTED';
  }

  get inProgressStatus() {
    return 'IN_PROGRESS';
  }

  get doneStatus() {
    return 'DONE';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.notStartedStatus,
      '2': oThis.inProgressStatus,
      '3': oThis.doneStatus,
      '4': oThis.failedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new VideoMergeJobConstants();
