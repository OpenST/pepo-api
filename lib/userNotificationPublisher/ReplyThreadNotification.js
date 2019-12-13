const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  AllRepliesByParentVideoIdCache = require(rootPrefix + '/lib/cacheManagement/single/AllRepliesByParentVideoId'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');
/**
 * Class for reply thread notification publish
 *
 * @class ReplyThreadNotification
 */
class ReplyThreadNotification extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.replyDetailId
   * @param {number} params.userId
   * @param {number} params.videoId
   * @param {number} params.parentVideoOwnerUserId
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
    oThis.userId = params.userId;
    oThis.parentVideoOwnerUserId = params.parentVideoOwnerUserId;
    oThis.videoId = params.videoId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.mentionedUserIds = params.mentionedUserIds;
    oThis.replyThreadFollowerUserIds = [];
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

    await oThis._fetchReplyThreadFollowers();

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

    logger.log('Start:: Validate for ReplyThreadNotification');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoOwnerUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_rtn_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            replyDetailId: oThis.replyDetailId,
            userId: oThis.userId,
            videoId: oThis.videoId,
            parentVideoOwnerUserId: oThis.parentVideoOwnerUserId,
            parentVideoId: oThis.parentVideoId
          }
        })
      );
    }

    logger.log('End:: Validate for ReplyThreadNotification');
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
    logger.log('Start:: _setNotificationCentrePayload for ReplyThreadNotification');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.parentVideoOwnerUserId,
      payload: {
        replyDetailId: oThis.replyDetailId,
        parentVideoId: oThis.parentVideoId,
        videoId: oThis.videoId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ReplyThreadNotification');
  }

  /**
   * Fetch reply thread followers.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchReplyThreadFollowers() {
    const oThis = this;

    const allRepliesByParentVideoIdCacheResponse = await new AllRepliesByParentVideoIdCache({
      parentVideoId: oThis.parentVideoId
    }).fetch();

    if (allRepliesByParentVideoIdCacheResponse.isFailure()) {
      return Promise.reject(allRepliesByParentVideoIdCacheResponse);
    }

    const allRepliesForParentVideoId = allRepliesByParentVideoIdCacheResponse.data.allReplies;

    if (!allRepliesForParentVideoId || allRepliesForParentVideoId.length <= 1) {
      return;
    }

    // Send notification only to the replier before latest reply
    const latestReply = allRepliesForParentVideoId[1],
      latestReplyCreator = latestReply[replyDetailConstants.longToShortNamesMapForCache['creatorUserId']];

    oThis.replyThreadFollowerUserIds = [latestReplyCreator];
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
    logger.log('Start:: _fetchPublishUserIds for ReplyThreadNotification');

    // If user has been mentioned in replied video, don't publish reply thread notification.

    oThis.publishUserIds = oThis.replyThreadFollowerUserIds;

    if (oThis.publishUserIds.length > 0) {
      await oThis.enqueueUserNotification();

      // Insert into notification_hooks table for hook push notifications.
      await oThis._insertIntoNotificationHook();
    }

    logger.log('End:: _fetchPublishUserIds for ReplyThreadNotification');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replyThreadNotificationKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.replyThreadNotificationKind;
  }
}

module.exports = ReplyThreadNotification;
