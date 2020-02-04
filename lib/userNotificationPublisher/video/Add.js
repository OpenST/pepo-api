const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for video add publishing.
 *
 * @class VideoAdd
 */
class VideoAdd extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.videoId
   * @param {number} params.userId
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

    logger.log('Start:: Validate for VideoAdd');
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
          internal_error_identifier: 'l_unp_va_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }

    logger.log('End:: Validate for VideoAdd');
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
    logger.log('Start:: _setNotificationCentrePayload for VideoAdd');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.userId,
      payload: {
        videoId: oThis.videoId,
        channelId: oThis.channelId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for VideoAdd');
  }

  /**
   * Get DEFAULT heading version for activity centre.
   *
   * @returns {number}
   * @private
   */
  _getHeadingVersionForActivityCentre() {
    const oThis = this;

    // Check lib/notification/config/notificationCentre config for videoAddKind.
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
    return userNotificationConstants.videoAddKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.videoAddKind;
  }
}

module.exports = VideoAdd;
