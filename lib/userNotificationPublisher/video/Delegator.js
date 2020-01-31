const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class VideoDelegator extends UserNotificationPublisherBase {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.videoId
   * @param {array} params.mentionedUserIds
   * @param {array} params.channelIds
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
    oThis.mentionedUserIds = params.mentionedUserIds || [];
    oThis.channelIds = params.channelIds || [];

    oThis.notificationKindToPublishUserIds = {
      [userNotificationConstants.userMentionKind]: [],
      [userNotificationConstants.videoAddKind]: []
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

    logger.log('Start:: Validate for VideoDelegator');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.videoId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_v_d_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            userId: oThis.userId,
            videoId: oThis.videoId
          }
        })
      );
    }

    logger.log('End:: Validate for VideoDelegator');
  }

  /**
   * Set recipient user ids
   *
   * @return {Promise<void>}
   * @private
   */
  async _setRecipientUserIds() {
    const oThis = this;

    // Fetch user supporters.
    let supporterUserIds = await oThis._fetchUserSupporters();

    // Remove mentioned user ids as they will get above notification.
    supporterUserIds = basicHelper.arrayDiff(supporterUserIds, oThis.mentionedUserIds);

    // Remove muted user ids as they will get above notification.
    supporterUserIds = await oThis._filterMutedUserIds(supporterUserIds);

    // At mention has highest priority.
    if (oThis.mentionedUserIds.length) {
      oThis.mentionedUserIds = basicHelper.arrayDiff(oThis.mentionedUserIds, [oThis.userId]);
      oThis.notificationKindToPublishUserIds[userNotificationConstants.userMentionKind] = oThis.mentionedUserIds;
    }
    // If user has supporters it has second priority.
    else if (supporterUserIds.length > 0) {
      oThis.notificationKindToPublishUserIds[userNotificationConstants.videoAddKind] = supporterUserIds;
    }
    // If channel id is present, then channel members will get notification.
    else if (oThis.channelIds.length > 0) {
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
    logger.log('Start:: _fetchPublishUserIds for VideoDelegator');

    // Enqueue activities.
    for (const notificationKind in oThis.notificationKindToPublishUserIds) {
      const publishUserIds = oThis.notificationKindToPublishUserIds[notificationKind];

      if (!publishUserIds.length) {
        continue;
      }

      await oThis._enqueueNotificationForKind(notificationKind);
    }

    logger.log('End:: _fetchPublishUserIds for VideoDelegator');
  }

  /**
   * Fetch supporters for particular user.
   *
   * @returns {Promise<[]>}
   * @private
   */
  async _fetchUserSupporters() {
    const oThis = this,
      recipientUserIds = [];

    let pageNo = 1,
      lastId = -1;

    while (true) {
      const UserContributedByPaginationCacheObj = new UserContributorByUserIdPaginationCache({
          limit: paginationConstants.defaultUserContributionPageSize,
          page: pageNo,
          userId: oThis.userId
        }),
        userPaginationCacheRes = await UserContributedByPaginationCacheObj.fetch();

      if (userPaginationCacheRes.isFailure()) {
        return Promise.reject(userPaginationCacheRes);
      }

      const contributorUserCount = userPaginationCacheRes.data.contributedByUserIds.length;

      if (contributorUserCount < 1) {
        break;
      }

      for (let index = 0; index < contributorUserCount; index++) {
        const contributorUserId = userPaginationCacheRes.data.contributedByUserIds[index],
          currentUserContributorRowId = userPaginationCacheRes.data.contributionUsersByUserIdsMap[contributorUserId].id;

        if (pageNo !== 1 && lastId <= currentUserContributorRowId) {
          continue;
        }
        recipientUserIds.push(contributorUserId);
      }

      logger.log('recipientUserIds =====', recipientUserIds);

      let lastUserId = userPaginationCacheRes.data.contributedByUserIds[contributorUserCount - 1];
      lastId = userPaginationCacheRes.data.contributionUsersByUserIdsMap[lastUserId].id;
      pageNo++;
    }

    return recipientUserIds;
  }

  /**
   * Filter muted user ids.
   *
   * @private
   */
  async _filterMutedUserIds(userIds) {
    const oThis = this;

    const userMuteByUser1IdsResp = await new UserMuteByUser1IdsCache({ user1Ids: userIds }).fetch();

    if (userMuteByUser1IdsResp.isFailure()) {
      return Promise.reject(userMuteByUser1IdsResp);
    }

    const userMuteByUser1IdsRespData = userMuteByUser1IdsResp.data,
      unMutedUserIds = [];

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];

      // If current user id is muted by any of publishUserIds, remove it.
      if (!userMuteByUser1IdsRespData[userId] || !userMuteByUser1IdsRespData[userId][oThis.userId]) {
        unMutedUserIds.push(userId);
      }
    }

    return unMutedUserIds;
  }

  /**
   * Enqueue notification based on kind
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueNotificationForKind(kind) {
    const oThis = this;

    logger.log('Start:: _enqueueNotificationForKind for VideoDelegator:: ', kind);

    const params = {
      userId: oThis.userId,
      videoId: oThis.videoId,
      mentionedUserIds: oThis.mentionedUserIds,
      publishUserIds: oThis.notificationKindToPublishUserIds[kind]
    };

    logger.log('_enqueueNotificationForKind params:: ', params);

    switch (kind) {
      case userNotificationConstants.videoAddKind: {
        return new oThis._videoAddClass(params).perform();
      }

      case userNotificationConstants.userMentionKind: {
        return new oThis._userMentionInVideoClass(params).perform();
      }

      default:
        return responseHelper.error({
          internal_error_identifier: 'l_un_rn_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: { msg: 'Invalid notification kind' } }
        });
    }
  }

  get _videoAddClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/Add');
  }

  get _userMentionInVideoClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/UserMention');
  }
}

module.exports = VideoDelegator;
