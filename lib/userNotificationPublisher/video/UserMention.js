const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for video user mention.
 *
 * @class VideoUserMention
 */
class VideoUserMention extends UserNotificationPublisherBase {
  /**
   * Constructor for video user mention.
   *
   * @param {object} params
   * @param {number} params.videoId
   * @param {number} params.userId
   * @param {number} params.mentionedUserIds
   * @param {Array} params.publishUserIds
   * @param {Array} params.channelId
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.videoId;
    oThis.userId = params.userId;
    oThis.mentionedUserIds = params.mentionedUserIds;
    oThis.publishUserIds = params.publishUserIds;
    oThis.channelId = params.channelId;
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

    logger.log('Start:: Validate for VideoUserMention');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_um_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }

    logger.log('End:: Validate for VideoUserMention');
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
    logger.log('Start:: _setNotificationCentrePayload for VideoUserMention');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.userId,
      payload: {
        videoId: oThis.videoId,
        channelId: oThis.channelId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for VideoUserMention');
  }

  /**
   * Get DEFAULT heading version for activity centre.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersionForActivityCentre() {
    const oThis = this;

    // Check lib/notification/config/notificationCentre config for userMentionKind.
    if (oThis.channelId) {
      return 2;
    }

    return 1;
  }

  /**
   * Get heading version.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersion() {
    const oThis = this;

    // Check lib/pushNotification/responseConfig config for userMentionKind.
    if (oThis.channelId) {
      return 2;
    }

    return 1;
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.userMentionKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.userMentionKind;
  }
}

module.exports = VideoUserMention;
