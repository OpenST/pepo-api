const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for profile url constants
 *
 * @class
 */
class ProfileUrlConstants {
  /**
   * Constructor for profile url.
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

  get Kinds() {
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

    invertedKinds = util.invert(oThis.Kinds);

    return invertedKinds;
  }
}

module.exports = new ProfileUrlConstants();
