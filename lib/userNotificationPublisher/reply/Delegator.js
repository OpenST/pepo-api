const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  AllRepliesByParentVideoIdCache = require(rootPrefix + '/lib/cacheManagement/single/AllRepliesByParentVideoId'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class ReplyDelegator extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.parentVideoOwnerUserId
   * @param {number} params.replyDetailId
   * @param {number} params.replyEntityId
   * @param {number} params.parentVideoId
   * @param {number} params.amount
   * @param {array} params.mentionedUserIds
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.actor = params.userId;
    oThis.parentVideoOwnerUserId = params.parentVideoOwnerUserId;
    oThis.replyDetailId = params.replyDetailId;
    oThis.replyEntityId = params.replyEntityId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.amount = params.amount;
    oThis.mentionedUserIds = params.mentionedUserIds;

    oThis.lastReplyCreator = null;
    oThis.notificationKindToPublishUserIds = {
      [userNotificationConstants.youRepliedWithAmountKind]: [],
      [userNotificationConstants.youRepliedWithoutAmountKind]: [],
      [userNotificationConstants.replyOnYourVideoWithAmountKind]: [],
      [userNotificationConstants.replyOnYourVideoWithoutAmountKind]: [],
      [userNotificationConstants.replyUserMentionKind]: [],
      [userNotificationConstants.replyThreadNotificationKind]: []
    };
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._setLastReplyCreator();

    await oThis._setRecipientUserIds();

    await oThis._publishForUserIds();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    logger.log('Start:: Validate for ReplyDelegator');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId) ||
      !CommonValidators.validateNonZeroInteger(oThis.actor) ||
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
            userId: oThis.actor,
            amount: oThis.amount,
            parentVideoOwnerUserId: oThis.parentVideoOwnerUserId,
            parentVideoId: oThis.parentVideoId
          }
        })
      );
    }

    logger.log('End:: Validate for ReplyDelegator');
  }

  /**
   * Set last reply creator
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  async _setLastReplyCreator() {
    const oThis = this;

    const allRepliesByParentVideoIdCacheResponse = await new AllRepliesByParentVideoIdCache({
      parentVideoId: oThis.parentVideoId
    }).fetch();

    if (allRepliesByParentVideoIdCacheResponse.isFailure()) {
      return Promise.reject(allRepliesByParentVideoIdCacheResponse);
    }

    const allRepliesForParentVideoId = allRepliesByParentVideoIdCacheResponse.data.allReplies;

    if (
      !allRepliesForParentVideoId ||
      allRepliesForParentVideoId.length <= 1 ||
      Number(allRepliesForParentVideoId[0][replyDetailConstants.longToShortNamesMapForCache['replyDetailsId']]) ===
        Number(oThis.replyDetailId)
    ) {
      logger.log('No Last reply notification to be sent');
      //do not send last reply notification if there were other replies after the current reply
      return;
    }

    // Send notification only to the replier before latest reply
    const latestReply = allRepliesForParentVideoId[1];

    oThis.lastReplyCreator = latestReply[replyDetailConstants.longToShortNamesMapForCache['creatorUserId']];
  }

  /**
   * Set recipient user ids
   *
   * @return {Promise<void>}
   * @private
   */
  async _setRecipientUserIds() {
    const oThis = this;

    // Sender won't get mention notification
    oThis.mentionedUserIds = basicHelper.arrayDiff(oThis.mentionedUserIds, [oThis.actor]);

    const selfActivityNotificationKind = oThis.amount
      ? userNotificationConstants.youRepliedWithAmountKind
      : userNotificationConstants.youRepliedWithoutAmountKind;

    const replyOnYourVideoNotificationKind = oThis.amount
      ? userNotificationConstants.replyOnYourVideoWithAmountKind
      : userNotificationConstants.replyOnYourVideoWithoutAmountKind;

    const isVideoOwnerMentionedInReply = oThis.mentionedUserIds.includes(oThis.parentVideoOwnerUserId);
    const isVideoOwnerIsActor = oThis.parentVideoOwnerUserId == oThis.actor;

    // At mention notification - 1st priority
    oThis.notificationKindToPublishUserIds[userNotificationConstants.replyUserMentionKind] = oThis.mentionedUserIds;

    // If parent video owner is mentioned, don't send reply on your video notification - as we have sent at mention notification.
    // Also if video owner is actor, don't send reply on your video notification.
    if (isVideoOwnerMentionedInReply || isVideoOwnerIsActor) {
      oThis.notificationKindToPublishUserIds[replyOnYourVideoNotificationKind] = [];
    } else {
      oThis.notificationKindToPublishUserIds[replyOnYourVideoNotificationKind] = [oThis.parentVideoOwnerUserId];
    }

    // Sender gets only one notification in any case
    if (!isVideoOwnerIsActor) {
      oThis.notificationKindToPublishUserIds[selfActivityNotificationKind] = [oThis.actor];
    }

    // Skip reply thread notification if she is already mentioned
    // Skip reply thread notification if she is actor
    // Skip reply thread notification if she is parent video owner
    if (
      oThis.lastReplyCreator &&
      !oThis.mentionedUserIds.includes(oThis.lastReplyCreator) &&
      oThis.lastReplyCreator != oThis.actor &&
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
   * @return {Promise<void>}
   * @private
   */
  async _publishForUserIds() {
    const oThis = this;
    logger.log('Start:: _fetchPublishUserIds for ReplyDelegator');

    // Enqueue activities
    for (const notificationKind in oThis.notificationKindToPublishUserIds) {
      const publishUserIds = oThis.notificationKindToPublishUserIds[notificationKind];

      if (!publishUserIds.length) {
        continue;
      }

      await oThis._enqueueNotificationForKind(notificationKind);
    }

    logger.log('End:: _fetchPublishUserIds for ReplyDelegator');
  }

  /**
   * Enqueue notification based on kind
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueNotificationForKind(kind) {
    const oThis = this;

    logger.log('Start:: _enqueueNotificationForKind for ReplyDelegator:: ', kind);

    const params = {
      userId: oThis.actor, // Replier
      parentVideoOwnerUserId: oThis.parentVideoOwnerUserId, // Original video creator
      replyDetailId: oThis.replyDetailId,
      replyEntityId: oThis.replyEntityId,
      parentVideoId: oThis.parentVideoId,
      amount: oThis.amount,
      publishUserIds: oThis.notificationKindToPublishUserIds[kind]
    };

    logger.log('_enqueueNotificationForKind params:: ', params);

    switch (kind) {
      case userNotificationConstants.youRepliedWithoutAmountKind: {
        return new oThis._youRepliedWithoutAmount(params).perform();
      }

      case userNotificationConstants.youRepliedWithAmountKind: {
        return new oThis._youRepliedWithAmount(params).perform();
      }

      case userNotificationConstants.replyThreadNotificationKind: {
        return new oThis._othersInThread(params).perform();
      }

      case userNotificationConstants.replyOnYourVideoWithAmountKind: {
        return new oThis._onYourVideoWithAmount(params).perform();
      }

      case userNotificationConstants.replyOnYourVideoWithoutAmountKind: {
        return new oThis._onYourVideoWithoutAmount(params).perform();
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
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/AtMention');
  }

  get _youRepliedWithAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/YouRepliedWithAmount');
  }

  get _youRepliedWithoutAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/YouRepliedWithoutAmount');
  }

  get _othersInThread() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/Thread');
  }

  get _onYourVideoWithAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/OnYourVideoWithAmount');
  }

  get _onYourVideoWithoutAmount() {
    return require(rootPrefix + '/lib/userNotificationPublisher/reply/OnYourVideoWithoutAmount');
  }
}

module.exports = ReplyDelegator;
