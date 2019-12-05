const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');
/**
 * Class for reply receiver notification publish
 *
 * @class ReplyReceiverWithAmount
 */
class ReplyReceiverWithAmount extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.replyDetailId
   * @param {number} params.userId
   * @param {number} params.parentVideoOwnerUserId
   * @param {number} params.videoId
   * @param {number} params.amount
   * @param {number} params.parentVideoId
   * @param {array} params.mentionedUserIds
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailId = params.replyDetailId;
    oThis.videoId = params.videoId;
    oThis.userId = params.userId;
    oThis.parentVideoOwnerUserId = params.parentVideoOwnerUserId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.amount = params.amount;
    oThis.mentionedUserIds = params.mentionedUserIds;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setNotificationCentrePayload();

    await oThis._publishForUserIds();

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

    logger.log('Start:: Validate for ReplyReceiverWithAmount');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoOwnerUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.amount)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_rrwa_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            replyDetailId: oThis.replyDetailId,
            videoId: oThis.videoId,
            userId: oThis.userId,
            amount: oThis.amount,
            parentVideoOwnerUserId: oThis.parentVideoOwnerUserId,
            parentVideoId: oThis.parentVideoId
          }
        })
      );
    }

    logger.log('End:: Validate for ReplyReceiverWithAmount');
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
    logger.log('Start:: _setNotificationCentrePayload for ReplyReceiverWithAmount');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.parentVideoOwnerUserId,
      payload: {
        replyDetailId: oThis.replyDetailId,
        parentVideoId: oThis.parentVideoId,
        amount: oThis.amount,
        videoId: oThis.videoId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ReplyReceiverWithAmount');
  }

  /**
   * Get contributors list and enqueue for them.
   *
   * @sets oThis.publishUserIds
   *
   * @return {Promise<void>}
   * @private
   */
  async _publishForUserIds() {
    const oThis = this;
    logger.log('Start:: _fetchPublishUserIds for ReplyReceiverWithAmount');

    // if user has been mentioned in replied video, don't publish reply notification.
    if (oThis.mentionedUserIds.includes(oThis.parentVideoOwnerUserId)) {
      return;
    }

    oThis.publishUserIds = [oThis.parentVideoOwnerUserId];

    if (oThis.publishUserIds.length > 0) {
      await oThis.enqueueUserNotification();

      // Insert into notification_hooks table for hook push notifications.
      await oThis._insertIntoNotificationHook();
    }

    logger.log('End:: _fetchPublishUserIds for ReplyReceiverWithAmount');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replyReceiverWithAmountKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.replyReceiverWithAmountKind;
  }
}

module.exports = ReplyReceiverWithAmount;
