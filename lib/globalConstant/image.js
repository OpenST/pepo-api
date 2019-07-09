const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds;

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

  get notResized() {
    return 'NOT_RESIZED';
  }

  get profileImageKind() {
    return 'PROFILE_IMAGE';
  }

  get coverImageKind() {
    return 'COVER_IMAGE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.notResized,
      '2': oThis.resizeStarted,
      '3': oThis.resizeDone,
      '4': oThis.resizeFailed
    };
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileImageKind,
      '2': oThis.coverImageKind
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

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }

  get allowedImageKinds() {
    const oThis = this;
    return {
      [oThis.profileImageKind]: 1,
      [oThis.coverImageKind]: 1
    };
  }
}

module.exports = new ImageConstants();
