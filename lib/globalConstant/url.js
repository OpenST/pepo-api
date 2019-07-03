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

  get twitterUrlKind() {
    return 'TWITTER';
  }

  get instagramUrlKind() {
    return 'INSTAGRAM';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.twitterUrlKind,
      '2': oThis.instagramUrlKind
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
