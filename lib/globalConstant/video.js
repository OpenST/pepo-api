const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for video constants
 *
 * @class
 */
class VideoConstants {
  /**
   * Constructor for video constants.
   *
   * @constructor
   */
  constructor() {}

  get resizeDone() {
    return 'RESIZE_DONE';
  }

  get resizeStarted() {
    return 'RESIZE_STARTED';
  }

  get resizeFailed() {
    return 'RESIZE_FAILED';
  }

  get notResized() {
    return 'NOT_RESIZED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.notResized,
      '2': oThis.resizeDone,
      '3': oThis.resizeStarted,
      '4': oThis.resizeFailed
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new VideoConstants();
