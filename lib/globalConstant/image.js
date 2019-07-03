const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for image constants
 *
 * @class
 */
class ImageConstants {
  /**
   * Constructor for image constants.
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

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.resizeDone,
      '2': oThis.resizeStarted,
      '3': oThis.resizeFailed
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new ImageConstants();
