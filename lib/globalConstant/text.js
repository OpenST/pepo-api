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

  get channelTaglineKind() {
    return 'CHANNEL_TAGLINE';
  }

  get channelDescriptionKind() {
    return 'CHANNEL_DESCRIPTION';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.bioKind,
      '2': oThis.videoDescriptionKind,
      '3': oThis.channelTaglineKind,
      '4': oThis.channelDescriptionKind
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

  get truncatedChannelTaglineLimit() {
    return 120;
  }
}

module.exports = new TextConstants();
