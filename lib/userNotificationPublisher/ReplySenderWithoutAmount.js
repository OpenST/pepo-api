const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');
/**
 * Class for reply sender notification publish
 *
 * @class ReplySenderWithoutAmount
 */
class ReplySenderWithoutAmount extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.replyDetailId
   * @param {number} params.userId
   * @param {number} params.parentVideoOwnerUserId
   * @param {number} params.videoId
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailId = params.replyDetailId;
    oThis.userId = params.userId;
    oThis.parentVideoOwnerUserId = params.parentVideoOwnerUserId;
    oThis.videoId = params.videoId;
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

    logger.log('Start:: Validate for ReplySenderWithAmount');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoOwnerUserId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_rswoa_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            replyDetailId: oThis.replyDetailId,
            userId: oThis.userId,
            videoId: oThis.videoId,
            parentVideoOwnerUserId: oThis.parentVideoOwnerUserId
          }
        })
      );
    }

    logger.log('End:: Validate for ReplySenderWithoutAmount');
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
    logger.log('Start:: _setNotificationCentrePayload for ReplySenderWithoutAmount');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.parentVideoOwnerUserId,
      payload: {
        replyDetailId: oThis.replyDetailId,
        videoId: oThis.videoId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ReplySenderWithoutAmount');
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
    logger.log('Start:: _fetchPublishUserIds for ReplySenderWithoutAmount');

    oThis.publishUserIds = [oThis.userId];

    if (oThis.publishUserIds.length > 0) {
      await oThis.enqueueUserNotification();
    }

    logger.log('End:: _fetchPublishUserIds for ReplySenderWithoutAmount');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replySenderWithoutAmountKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.replySenderWithoutAmountKind;
  }
}

module.exports = ReplySenderWithoutAmount;
