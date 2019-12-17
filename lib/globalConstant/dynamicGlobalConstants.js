const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

/**
 * Class for dynamic global constant's constants.
 *
 * @class DynamicGlobalConstants
 */
class DynamicGlobalConstants {
  get pepoValuePopularityThreshold() {
    return 'pepoValuePopularityThreshold';
  }

  get numberOfRepliesPopularityThreshold() {
    return 'numberOfRepliesPopularityThreshold';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.pepoValuePopularityThreshold,
      '2': oThis.numberOfRepliesPopularityThreshold
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new DynamicGlobalConstants();
