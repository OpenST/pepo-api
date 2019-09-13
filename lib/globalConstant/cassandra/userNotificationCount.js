const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

/**
 * Class for userNotificationVisitDetail constants.
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
    return util.invert(oThis.shortToLongNamesMap);
  }
}

module.exports = new userNotificationCountConstants();
