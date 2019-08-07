const rootPrefix = '.././../..',
  ProfileTransactionBase = require(rootPrefix + '/lib/jobs/notification/profileTransaction/Base'),
  notificationTemplate = require(rootPrefix + '/lib/jobs/notification/config.json'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for profile transaction receive success.
 *
 * @class ProfileTransactionReceiveSuccess
 */
class ProfileTransactionReceiveSuccess extends ProfileTransactionBase {
  /**
   * Returns template.
   *
   * @returns {*}
   */
  get template() {
    return notificationTemplate[userNotificationConstants.profileTxReceiveSuccessKind];
  }

  /**
   * Returns kind of notification.
   *
   * @returns {string}
   */
  get kind() {
    return userNotificationConstants.profileTxReceiveSuccessKind;
  }

  /**
   * Returns template variables.
   *
   * @returns {object}
   */
  get templateVars() {
    const oThis = this;

    return { user_id: oThis.actorId, users: '{{users}}', username: '{{username}}' };
  }
}

module.exports = ProfileTransactionReceiveSuccess;
