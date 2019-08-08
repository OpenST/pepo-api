const rootPrefix = '../../..',
  BaseMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Base');

class UserNotificationList extends BaseMetaFormatter {
  /**
   * Append service specific keys in meta
   *
   * @param meta
   * @private
   */
  _appendSpecificMetaData(meta) {
    return meta;
  }
}

module.exports = UserNotificationList;
