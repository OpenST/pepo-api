const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for userNotificationVisitDetail constants.
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
    return util.invert(oThis.shortToLongNamesMap);
  }
}

module.exports = new userNotificationVisitDetailConstants();
