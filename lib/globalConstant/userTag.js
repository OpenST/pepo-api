const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

/**
 * Class for user tag constants.
 *
 * @class UserTagConstants
 */
class UserTagConstants {
  get selfAddedKind() {
    return 'self_added';
  }

  get derivedKind() {
    return 'derived';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.selfAddedKind,
      '2': oThis.derivedKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserTagConstants();
