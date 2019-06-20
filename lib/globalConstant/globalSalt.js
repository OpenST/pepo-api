const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

// Declare constants.
let kinds, invertedKinds;

/**
 * Class for global salts constants.
 *
 * @class GlobalSalt
 */
class GlobalSalt {
  get configStrategyKind() {
    return 'configStrategy';
  }

  get kinds() {
    const oThis = this;

    if (kinds) {
      return kinds;
    }

    kinds = {
      '1': oThis.configStrategyKind
    };

    return kinds;
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

module.exports = new GlobalSalt();
