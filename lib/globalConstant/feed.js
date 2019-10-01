const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for feed constants
 *
 * @class
 */
class FeedConstants {
  getPersonalizedFeedMaxIdsCount() {
    return 500;
  }

  get fanUpdateKind() {
    return 'FAN_UPDATE';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.fanUpdateKind
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
