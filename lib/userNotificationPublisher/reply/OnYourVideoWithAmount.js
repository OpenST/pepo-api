const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class ReplyOnYourVideoWithAmount extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.replyDetailId
   * @param {number} params.userId
   * @param {number} params.parentVideoOwnerUserId
   * @param {number} params.replyEntityId
   * @param {number} params.amount
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
    oThis.parentVideoId = params.parentVideoId;
    oThis.amount = params.amount;
    oThis.publishUserIds = params.publishUserIds;
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

    logger.log('Start:: Validate for ReplyOnYourVideoWithAmount');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoOwnerUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.replyEntityId) ||
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
            replyEntityId: oThis.replyEntityId,
            userId: oThis.userId,
            amount: oThis.amount,
            parentVideoOwnerUserId: oThis.parentVideoOwnerUserId,
            parentVideoId: oThis.parentVideoId
          }
        })
      );
    }

    logger.log('End:: Validate for ReplyOnYourVideoWithAmount');
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
    logger.log('Start:: _setNotificationCentrePayload for ReplyOnYourVideoWithAmount');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.parentVideoOwnerUserId,
      payload: {
        replyDetailId: oThis.replyDetailId,
        parentVideoId: oThis.parentVideoId,
        amount: oThis.amount,
        videoId: oThis.replyEntityId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ReplyOnYourVideoWithAmount');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replyOnYourVideoWithAmountKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.replyOnYourVideoWithAmountKind;
  }
}

module.exports = ReplyOnYourVideoWithAmount;
