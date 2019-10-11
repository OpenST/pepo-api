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
    //Note:-last_visited_at is for activity_last_visited_by.
    return {
      user_id: 'userId',
      last_visited_at: 'activityLastVisitedAt',
      latest_seen_feed_time: 'latestSeenFeedTime'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }
}

module.exports = new userNotificationVisitDetailConstants();
