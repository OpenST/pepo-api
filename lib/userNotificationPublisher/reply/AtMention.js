const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/big/NotificationHook'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  UserNotificationCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationCount'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

class ReplyAtMention extends UserNotificationPublisherBase {
  /**
   * Constructor for reply user mentions publishing.
   *
   * @param {object} params
   * @param {number} params.replyDetailId
   * @param {number} params.replyEntityId
   * @param {number} params.userId
   * @param {number} params.parentVideoOwnerUserId
   * @param {number} params.parentVideoId
   * @param {array} params.publishUserIds
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailId = params.replyDetailId;
    oThis.replyEntityId = params.replyEntityId;
    oThis.userId = params.userId;
    oThis.parentVideoOwnerUserId = params.parentVideoOwnerUserId;
    oThis.publishUserIds = params.publishUserIds;
    oThis.parentVideoId = params.parentVideoId;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setNotificationCentrePayload();

    await oThis.enqueueUserNotification();

    // Insert into notification_hooks table for hook push notifications.
    await oThis._insertIntoNotificationHook();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Start:: Validate for ReplyAtMention');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.replyEntityId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoOwnerUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_rpum_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            replyDetailId: oThis.replyDetailId,
            userId: oThis.userId,
            replyEntityId: oThis.replyEntityId,
            parentVideoOwnerUserId: oThis.parentVideoOwnerUserId,
            parentVideoId: oThis.parentVideoId
          }
        })
      );
    }

    logger.log('End:: Validate for ReplyAtMention');
  }

  /**
   * Get DEFAULT heading version for activity centre.
   *
   * @param {number} [publishUserId]
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersionForActivityCentre(publishUserId) {
    const oThis = this;

    if (publishUserId == oThis.parentVideoOwnerUserId) {
      return 2;
    }

    return 1;
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.payload
   *
   * @return {Promise<void>}
   * @private
   */
  async _setNotificationCentrePayload() {
    const oThis = this;
    logger.log('Start:: _setNotificationCentrePayload for ReplyAtMention');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.parentVideoOwnerUserId,
      payload: {
        replyDetailId: oThis.replyDetailId,
        parentVideoId: oThis.parentVideoId,
        videoId: oThis.replyEntityId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ReplyAtMention');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replyUserMentionKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.replyUserMentionKind;
  }

  /**
   * Get heading version.
   *
   * @param {number} [publishUserId]
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersion(publishUserId) {
    const oThis = this;

    logger.log('From sub-class.');
    if (publishUserId && publishUserId == oThis.parentVideoOwnerUserId) {
      return 2;
    }

    return 1;
  }

  /**
   * Create entries in notification hooks model.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntriesForUserDeviceIdsInNotificationHookModel() {
    const oThis = this;

    const promiseArray = [];

    while (oThis.userDeviceIds.length > 0) {
      const userDeviceIds = oThis.userDeviceIds.splice(0, notificationHookConstants.hookSenderBatchSize);

      // Fetch publish user ids.
      const parentVideoOwnerDeviceIds = [];
      const otherDeviceIds = [];

      let puIds = [];
      for (let udi = 0; udi < userDeviceIds.length; udi++) {
        const deviceId = userDeviceIds[udi];
        const userId = oThis.deviceIdToUserIdMap[deviceId];

        // Aggregate all parentVideoOwnerDeviceIds.
        // We don't need to aggregate publishUserId as we know it is parentVideoOwnerUserId.
        if (+userId === +oThis.parentVideoOwnerUserId) {
          parentVideoOwnerDeviceIds.push(deviceId);
        } else {
          otherDeviceIds.push(deviceId);
          puIds.push(userId);
        }
      }

      // Create push notification entry for devices of parentVideoOwnerUserId.
      if (parentVideoOwnerDeviceIds.length !== 0) {
        const headingVersion = oThis._getHeadingVersion(oThis.parentVideoOwnerUserId);
        promiseArray.push(
          oThis._createPushNotificationEntry(parentVideoOwnerDeviceIds, [oThis.parentVideoOwnerUserId], headingVersion)
        );
      }

      if (puIds.length === 0) {
        continue;
      }
      puIds = [...new Set(puIds)];

      // Create push notification entry for other users.
      const headingVersion = oThis._getHeadingVersion();
      promiseArray.push(oThis._createPushNotificationEntry(otherDeviceIds, puIds, headingVersion));
    }

    await Promise.all(promiseArray);
  }

  /**
   * Create push notification entry.
   *
   * @param {array<number>} userDeviceIds
   * @param {array<number>} publishUserIds
   * @param {number} headingVersion
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createPushNotificationEntry(userDeviceIds, publishUserIds, headingVersion) {
    const oThis = this;

    const payload = basicHelper.deepDup(oThis.payload);

    payload.headingVersion = headingVersion;
    const notificationHookKind = oThis._notificationHookKind();

    // Create push notification insertion parameters.
    const insertParams = {
      event_type: notificationHookConstants.invertedEventTypes[notificationHookKind],
      user_device_ids: JSON.stringify(userDeviceIds),
      raw_notification_payload: JSON.stringify(payload),
      execution_timestamp: Math.round(Date.now() / 1000),
      status: notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus]
    };

    const promiseArray = [];

    // Create entry in notification hooks of MySql.
    promiseArray.push(new NotificationHookModel().insert(insertParams).fire());
    promiseArray.push(
      new UserNotificationCountModel().incrementUnreadNotificationCount({
        userIds: publishUserIds
      })
    );

    await Promise.all(promiseArray);
  }
}

module.exports = ReplyAtMention;
