const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for text constants.
 *
 * @class TextConstants
 */
class TextConstants {
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

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get truncatedSelfVideoDescriptionLimit() {
    return 150;
  }

  get truncatedVideoDescriptionLimit() {
    return 120;
  }
}

module.exports = new TextConstants();
