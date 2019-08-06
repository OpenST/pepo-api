const mustache = require('mustache'),
  uuidV4 = require('uuid/v4');

const rootPrefix = '.././..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  UserNotificationVisitDetailsByUserIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/cassandra/UserNotificationVisitDetailsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationTemplate = require(rootPrefix + '/lib/jobs/notification/config.json'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  userNotificationVisitDetailConstants = require(rootPrefix +
    '/lib/globalConstant/cassandra/userNotificationVisitDetail');

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

    const promisesArray = [];
    promisesArray.push(oThis.insertIntoUserNotificationsTable());
    promisesArray.push(oThis.updateUserNotificationVisitDetails());

    await Promise.all(promisesArray);
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    // Nothing to do.
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
   * Updates unread flag if needed in user notification visit details table.
   *
   * @returns {Promise<void>}
   */
  async updateUserNotificationVisitDetails() {
    const oThis = this;

    const unreadFlagResponse = await oThis.fetchUnreadFlag();

    if (!unreadFlagResponse.data) {
      const unreadParams = {
        user_id: oThis.actorId,
        unread_flag: userNotificationVisitDetailConstants.unreadFlagSetValue
      };
      await new UserNotificationVisitDetailModel().update(unreadParams);

      await UserNotificationVisitDetailModel.flushCache({ userId: oThis.actorId });
    }
  }

  /**
   * Returns unread flag.
   *
   * @returns {Promise<result<boolean>>}
   */
  async fetchUnreadFlag() {
    const oThis = this;

    const cacheResponse = await new UserNotificationVisitDetailsByUserIdsCache({ userIds: [oThis.actorId] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    if (!CommonValidator.validateNonEmptyObject(cacheResponse.data[oThis.actorId])) {
      return responseHelper.successWithData(false);
    }

    return responseHelper.successWithData(cacheResponse.data[oThis.actorId].unreadFlag);
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
