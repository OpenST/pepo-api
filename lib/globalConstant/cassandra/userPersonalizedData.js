const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let longToShortNamesMap, invertedKinds;

/**
 * Class for user personalized data constants.
 *
 * @class userPersonalizedDataConstants
 */
class UserPersonalizedDataConstants {
  get feedDataKind() {
    return 'FEED_DATA';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.feedDataKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get shortToLongNamesMap() {
    return {
      user_id: 'userId',
      kind: 'kind',
      unique_id: 'uniqueId',
      json_data: 'jsonData'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }
}

module.exports = new UserPersonalizedDataConstants();
