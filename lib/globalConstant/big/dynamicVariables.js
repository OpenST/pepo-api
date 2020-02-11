const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

/**
 * Class for dynamic variables constants.
 *
 * @class DynamicVariables
 */
class DynamicVariables {
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

module.exports = new DynamicVariables();
