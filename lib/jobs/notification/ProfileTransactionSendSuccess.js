const rootPrefix = '.././..',
  NotificationJobBase = require(rootPrefix + '/lib/jobs/notification/profileTransaction/Base'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for profile transaction send success.
 *
 * @class ProfileTransactionSendSuccess
 */
class ProfileTransactionSendSuccess extends NotificationJobBase {
  /**
   * Constructor for profile transaction send success.
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
    return userNotificationConstants.profileTxSendSuccessKind;
  }

  /**
   * Returns class job specific insert parameters.
   *
   * @returns {{}}
   */
  get specificInsertParams() {
    const oThis = this;

    return {
      subject_user_id: Number(oThis.subjectUserId),
      actor_ids: [oThis.actorId],
      actor_count: 1,
      transaction_id: oThis.transactionId
    };
  }
}

module.exports = ProfileTransactionSendSuccess;
