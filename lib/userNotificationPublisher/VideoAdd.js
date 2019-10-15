const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
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
   * Topic name for the job.
   *
   * @return {string}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.videoAdd;
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
        const contributorUserId = rsp.data.contributedByUserIds[index];
        if (pageNo !== 1 && lastId <= contributorUserId) {
          continue;
        }
        oThis.publishUserIds.push(contributorUserId);
      }

      logger.log('oThis.publishUserIds =====', oThis.publishUserIds);

      lastId = rsp.data.contributedByUserIds[contributorUserCount - 1];

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
