const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for video add publishing.
 *
 * @class NewVideoInChannel
 */
class NewVideoInChannel extends UserNotificationPublisherBase {
  /**
   * Constructor for new video in channel.
   *
   * @param {object} params
   * @param {number} params.videoId
   * @param {number} params.userId
   * @param {array} params.publishUserIds
   * @param {object} params.channelId
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.userId;
    oThis.videoId = params.videoId;
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

    logger.log('Start:: Validate for NewVideoInChannel');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.channelId) ||
      oThis.publishUserIds.length < 0
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_v_ca_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            videoId: oThis.videoId,
            userId: oThis.userId,
            channelId: oThis.channelId,
            publishUserIds: oThis.publishUserIds
          }
        })
      );
    }

    logger.log('End:: Validate for NewVideoInChannel');
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.payload
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setNotificationCentrePayload() {
    const oThis = this;
    logger.log('Start:: _setNotificationCentrePayload for NewVideoInChannel');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.userId,
      payload: {
        videoId: oThis.videoId,
        channelId: oThis.channelId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for NewVideoInChannel');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.videoAddInChannelKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.videoAddInChannelKind;
  }
}

module.exports = NewVideoInChannel;
