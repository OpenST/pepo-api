const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  AllRepliesByParentVideoIdCache = require(rootPrefix + '/lib/cacheManagement/single/AllRepliesByParentVideoId'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');
/**
 * Class for reply notifications publish
 *
 * @class ReplyReceiverWithAmount
 */
class ReplyNotifications extends UserNotificationPublisherBase {
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
   * @param {array} params.mentionedUserIds
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.userId;
    oThis.parentVideoOwnerUserId = params.parentVideoOwnerUserId;
    oThis.replyDetailId = params.replyDetailId;
    oThis.replyEntityId = params.replyEntityId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.amount = params.amount;
    oThis.mentionedUserIds = params.mentionedUserIds;

    oThis.lastReplyCreator = null;
    oThis.notificationKindToPublishUserIds = {
      [userNotificationConstants.replySenderWithAmountKind]: [],
      [userNotificationConstants.replySenderWithoutAmountKind]: [],
      [userNotificationConstants.replyReceiverWithAmountKind]: [],
      [userNotificationConstants.replyReceiverWithoutAmountKind]: [],
      [userNotificationConstants.replyUserMentionKind]: [],
      [userNotificationConstants.replyThreadNotificationKind]: []
    };
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchReplyThreadFollowers();

    await oThis._getPublishUserIdsForNotificationKinds();

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

    logger.log('Start:: Validate for ReplyNotifications');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoOwnerUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.replyEntityId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_rn_vas_1',
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

    logger.log('End:: Validate for ReplyNotifications');
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

    oThis.lastReplyCreator = latestReplyCreator;
  }

  /**
   * Get publisher user ids for notification kinds
   * @returns {Promise<void>}
   * @private
   */
  async _getPublishUserIdsForNotificationKinds() {
    const oThis = this;

    // Sender won't get mention notification
    oThis.mentionedUserIds = basicHelper.arrayDiff(oThis.mentionedUserIds, [oThis.userId]);

    const senderActivityNotificationKind = oThis.amount
        ? userNotificationConstants.replySenderWithAmountKind
        : userNotificationConstants.replySenderWithoutAmountKind,
      receiverActivityNotificationKind = oThis.amount
        ? userNotificationConstants.replyReceiverWithAmountKind
        : userNotificationConstants.replyReceiverWithoutAmountKind;

    // If receiver is mentioned send him mention otherwise receiver notification
    if (oThis.mentionedUserIds.includes(oThis.parentVideoOwnerUserId)) {
      oThis.notificationKindToPublishUserIds[userNotificationConstants.replyUserMentionKind] = oThis.mentionedUserIds;
      oThis.notificationKindToPublishUserIds[receiverActivityNotificationKind] = [];
    } else {
      oThis.notificationKindToPublishUserIds[receiverActivityNotificationKind] = [oThis.parentVideoOwnerUserId];
    }

    // Sender gets only one notification in any case
    oThis.notificationKindToPublishUserIds[senderActivityNotificationKind] = [oThis.userId];

    // Skip reply thread notification if he is already mentioned
    if (
      oThis.lastReplyCreator &&
      !oThis.mentionedUserIds.includes(oThis.lastReplyCreator) &&
      oThis.lastReplyCreator != oThis.userId &&
      oThis.lastReplyCreator != oThis.parentVideoOwnerUserId
    ) {
      oThis.notificationKindToPublishUserIds[userNotificationConstants.replyThreadNotificationKind] = [
        oThis.lastReplyCreator
      ];
    }
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
    logger.log('Start:: _fetchPublishUserIds for ReplyNotifications');

    // Enqueue activities
    for (const notificationKind in oThis.notificationKindToPublishUserIds) {
      oThis.publishUserIds = oThis.notificationKindToPublishUserIds[notificationKind];

      await oThis._enqueueNotificationForKind(notificationKind);
    }

    logger.log('End:: _fetchPublishUserIds for ReplyNotifications');
  }

  /**
   * Enqueue notification based on kind
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueNotificationForKind(kind) {
    const oThis = this;

    logger.log('Start:: _enqueueNotificationForKind for ReplyNotifications:: ', kind);

    const params = {
      userId: oThis.userId, // Replier
      parentVideoOwnerUserId: oThis.parentVideoOwnerUserId, // Original video creator
      replyDetailId: oThis.replyDetailId,
      replyEntityId: oThis.replyEntityId,
      parentVideoId: oThis.parentVideoId,
      amount: oThis.amount,
      publishUserIds: oThis.notificationKindToPublishUserIds[kind]
    };

    logger.log('_enqueueNotificationForKind params:: ', params);

    switch (kind) {
      case userNotificationConstants.replySenderWithoutAmountKind: {
        return new oThis._replySenderWithoutAmount(params).perform();
      }
      case userNotificationConstants.replySenderWithAmountKind: {
        return new oThis._replySenderWithAmount(params).perform();
      }
      case userNotificationConstants.replyThreadNotificationKind: {
        return new oThis._replyThreadNotification(params).perform();
      }
      case userNotificationConstants.replyReceiverWithAmountKind: {
        return new oThis._replyReceiverWithAmount(params).perform();
      }
      case userNotificationConstants.replyReceiverWithoutAmountKind: {
        return new oThis._replyReceiverWithoutAmount(params).perform();
      }
      case userNotificationConstants.replyUserMentionKind: {
        return new oThis._replyUserMentionEvent(params).perform();
      }
      default:
        return responseHelper.error({
          internal_error_identifier: 'l_un_rn_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: { msg: 'Invalid notification kind' } }
        });
    }
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replyNotificationsKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.replyNotificationsKind;
  }

  get _replyUserMentionEvent() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/ReplyUserMention');
  }

  get _replySenderWithAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/ReplySenderWithAmount');
  }

  get _replySenderWithoutAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/ReplySenderWithoutAmount');
  }

  get _replyThreadNotification() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/ReplyThreadNotification');
  }

  get _replyReceiverWithAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/ReplyReceiverWithAmount');
  }

  get _replyReceiverWithoutAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/ReplyReceiverWithoutAmount');
  }
}

module.exports = ReplyNotifications;
