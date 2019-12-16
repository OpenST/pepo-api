const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedConstantKinds = null;

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

  get constantKinds() {
    const oThis = this;

    return {
      '1': oThis.pepoValuePopularityThreshold,
      '2': oThis.numberOfRepliesPopularityThreshold
    };
  }

  get invertedConstantKinds() {
    const oThis = this;

    invertedConstantKinds = invertedConstantKinds || util.invert(oThis.constantKinds);

    return invertedConstantKinds;
  }
}

module.exports = new DynamicGlobalConstants();
