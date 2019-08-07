const mustache = require('mustache'),
  uuidV4 = require('uuid/v4');

const rootPrefix = '.././..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationTemplate = require(rootPrefix + '/lib/jobs/notification/config.json'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for profile transaction send success.
 *
 * @class ProfileTransactionSendSuccess
 */
class ProfileTransactionSendSuccess {
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
    const oThis = this;

    oThis.actorId = params.actorId;
    oThis.subjectUserId = params.subjectUserId;
    oThis.transactionId = params.transactionId;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis.insertIntoUserNotificationsTable();
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (
      CommonValidator.isVarNullOrUndefined(oThis.actorId) ||
      CommonValidator.isVarNullOrUndefined(oThis.subjectUserId) ||
      CommonValidator.isVarNullOrUndefined(oThis.transactionId)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_n_ptss_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            actorId: oThis.actorId,
            subjectUserId: oThis.subjectUserId,
            transactionId: oThis.transactionId
          }
        })
      );
    }
  }

  /**
   * Insert into user notifications table.
   *
   * @returns {Promise<void>}
   */
  async insertIntoUserNotificationsTable() {
    const oThis = this;

    const insertParams = {
      user_id: Number(oThis.actorId),
      last_action_timestamp: Math.floor(Date.now() / 1000),
      uuid: oThis.uuid,
      kind: Number(userNotificationConstants.invertedKinds[oThis.kind]),
      landing_vars: JSON.stringify({}),
      subject_user_id: Number(oThis.subjectUserId),
      heading: oThis.heading,
      actor_ids: [oThis.actorId],
      actor_count: 1,
      transaction_id: oThis.transactionId,
      video_id: null
    };

    await new UserNotificationModel().insert(insertParams);
  }

  /**
   * Returns template.
   *
   * @returns {*}
   */
  get template() {
    return notificationTemplate[userNotificationConstants.profileTxSendSuccessKind];
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
   * Returns UUIDv4.
   *
   * @returns {string}
   */
  get uuid() {
    return uuidV4();
  }

  /**
   * Returns heading.
   *
   * @returns {string}
   */
  get heading() {
    const oThis = this;

    const templateVars = { user_id: oThis.actorId, users: '{{users}}', username: '{{username}}' };

    return mustache.render(oThis.template.heading, templateVars);
  }
}

module.exports = ProfileTransactionSendSuccess;
