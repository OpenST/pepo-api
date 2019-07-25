const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

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

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserTagConstants();
