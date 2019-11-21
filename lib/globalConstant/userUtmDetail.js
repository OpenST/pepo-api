const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for user utm detail constants.
 *
 * @class
 */

let invertedKinds = null;

class UserUtmDetailConstants {
  /**
   * Constructor for user utm detail constants.
   *
   * @constructor
   */
  constructor() {}

  get signUpKind() {
    return 'signUp';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.signUpKind
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

module.exports = new UserUtmDetailConstants();
