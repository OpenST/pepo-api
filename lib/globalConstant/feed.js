const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for feed constants
 *
 * @class
 */
class FeedConstants {
  get transactionKind() {
    return 'OST_TRANSACTION';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.transactionKind
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

module.exports = new FeedConstants();
