const rootPrefix = '.././..',
  NotificationJobBase = require(rootPrefix + '/lib/jobs/notification/profileTransaction/Base'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for profile transaction receive success.
 *
 * @class ProfileTransactionReceiveSuccess
 */
class ProfileTransactionReceiveSuccess extends NotificationJobBase {
  /**
   * Constructor for profile transaction receive success.
   *
   * @param {object} params
   * @param {string/number} params.actorId
   * @param {string/number} params.subjectUserId
   * @param {string} params.transactionId
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.actorId = params.actorId;
    oThis.subjectUserId = params.subjectUserId;
    oThis.transactionId = params.transactionId;
  }

  /**
   * Return mandatory parameters.
   *
   * @returns {object}
   */
  get mandatoryParams() {
    const oThis = this;

    return {
      'oThis.actorId': oThis.actorId,
      'oThis.subjectUserId': oThis.subjectUserId,
      'oThis.transactionId': oThis.transactionId
    };
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
