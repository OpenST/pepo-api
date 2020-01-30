const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for url constants
 *
 * @class
 */
class UrlConstantts {
  /**
   * Constructor for url.
   *
   * @constructor
   */
  constructor() {}

  get socialUrlKind() {
    return 'SOCIAL_LINK';
  }

  get channelDescriptionUrlKind() {
    return 'CHANNEL_DESCRIPTION_LINK';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.socialUrlKind,
      '2': oThis.channelDescriptionUrlKind
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
}

module.exports = new UrlConstantts();
