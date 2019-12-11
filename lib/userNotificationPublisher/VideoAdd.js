const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
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
   * @param {Array} params.mentionedUserIds
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
    oThis.mentionedUserIds = params.mentionedUserIds || [];
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
          internal_error_identifier: 'l_unp_va_vas_1',
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
        videoId: oThis.videoId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for VideoAdd');
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
    logger.log('Start:: _fetchPublishUserIds for VideoAdd');

    let pageNo = 1,
      lastId = -1;

    while (true) {
      oThis.publishUserIds = [];

      const rsp = await oThis._fetchPaginatedUserIdsFromCache(pageNo);

      if (rsp.isFailure()) {
        return Promise.reject(rsp);
      }

      const contributorUserCount = rsp.data.contributedByUserIds.length;

      if (contributorUserCount < 1) {
        return;
      }

      for (let index = 0; index < contributorUserCount; index++) {
        const contributorUserId = rsp.data.contributedByUserIds[index],
          currentUserContributorRowId = rsp.data.contributionUsersByUserIdsMap[contributorUserId].id;

        if (pageNo !== 1 && lastId <= currentUserContributorRowId) {
          continue;
        }
        oThis.publishUserIds.push(contributorUserId);
      }

      logger.log('oThis.publishUserIds =====', oThis.publishUserIds);

      let lastUserId = rsp.data.contributedByUserIds[contributorUserCount - 1];

      lastId = rsp.data.contributionUsersByUserIdsMap[lastUserId].id;

      // Remove at mentioned user ids for which, notification is already published.
      oThis._filterOutAtMentionedUserIds();

      // Do not add notification for those who muted current actor id.
      await oThis._filterMutedUserIds();

      if (oThis.publishUserIds.length > 0) {
        await oThis.enqueueUserNotification();

        // Insert into notification_hooks table for hook push notifications.
        await oThis._insertIntoNotificationHook();
      }

      pageNo++;
    }

    logger.log('End:: _fetchPublishUserIds for VideoAdd');
  }

  /**
   * Fetch user ids from cache.
   *
   * @sets oThis.contributionUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache(page) {
    const oThis = this;

    const UserContributedByPaginationCacheObj = new UserContributorByUserIdPaginationCache({
        limit: paginationConstants.defaultUserContributionPageSize,
        page: page,
        userId: oThis.userId
      }),
      userPaginationCacheRes = await UserContributedByPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    return responseHelper.successWithData(userPaginationCacheRes.data);
  }

  /**
   * Filter out mentioned user ids from publisher user ids.
   * Because, for mentioned user ids, notification is already published.
   *
   * @sets oThis.publishUserIds
   *
   * @private
   */
  _filterOutAtMentionedUserIds() {
    const oThis = this;

    let allSupporters = oThis.publishUserIds;

    if (allSupporters && allSupporters.length > 0) {
      oThis.publishUserIds = basicHelper.arrayDiff(allSupporters, oThis.mentionedUserIds);
    }
  }

  /**
   * Filter muted user ids.
   *
   * @private
   */
  async _filterMutedUserIds() {
    const oThis = this;

    const userMuteByUser1IdsResp = await new UserMuteByUser1IdsCache({ user1Ids: oThis.publishUserIds }).fetch();

    if (userMuteByUser1IdsResp.isFailure()) {
      return Promise.reject(userMuteByUser1IdsResp);
    }

    const userMuteByUser1IdsRespData = userMuteByUser1IdsResp.data,
      publishUserIdsCopy = [...oThis.publishUserIds]; // Create deep copy of publish user ids.

    for (let index = 0; index < publishUserIdsCopy.length; index++) {
      const userId = publishUserIdsCopy[index];

      // If current user id is muted by any of publishUserIds, remove it.
      if (userMuteByUser1IdsRespData[userId] && userMuteByUser1IdsRespData[userId][oThis.userId]) {
        // TODO feed - optimize below. There are presently 2 loops inside this loop. n square.
        const indexToDelete = oThis.publishUserIds.indexOf(userId);

        oThis.publishUserIds.splice(indexToDelete, 1);
      }
    }
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
