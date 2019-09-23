const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let longToShortNamesMap;

/**
 * Class for user notification visit detail constants.
 *
 * @class userNotificationVisitDetailConstants
 */
class userNotificationVisitDetailConstants {
  get shortToLongNamesMap() {
    return {
      user_id: 'userId',
      last_visited_at: 'lastVisitedAt'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }
}

module.exports = new userNotificationVisitDetailConstants();
