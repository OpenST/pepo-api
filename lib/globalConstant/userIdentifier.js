const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for user identifiers constants.
 *
 * @class UserIdentifierConstants
 */
class UserIdentifierConstants {
  get emailKind() {
    return 'email';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.emailKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserIdentifierConstants();
