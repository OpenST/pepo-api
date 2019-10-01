const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for text constants.
 *
 * @class
 */
class TextConstants {
  /**
   * Constructor for text constants.
   *
   * @constructor
   */
  constructor() {}

  get bioKind() {
    return 'BIO';
  }

  get videoDescriptionKind() {
    return 'VIDEO_DESCRIPTION';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.bioKind,
      '2': oThis.videoDescriptionKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }

  get truncatedVideoDescriptionLimit() {
    return 50;
  }
}

module.exports = new TextConstants();
