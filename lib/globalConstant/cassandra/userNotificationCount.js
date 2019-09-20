const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let longToShortNamesMap;

/**
 * Class for user notification count constants.
 *
 * @class userNotificationCountConstants
 */
class userNotificationCountConstants {
  get shortToLongNamesMap() {
    return {
      user_id: 'userId',
      unread_notification_count: 'unreadNotificationCount'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }
}

module.exports = new userNotificationCountConstants();
