/**
 * Video Add Publishing
 *
 * @module lib/userNotificationPublisher/VideoAdd
 */

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Constructor for Video Add Publishing
 *
 * @class
 */
class VideoAdd extends UserNotificationPublisherBase {
  /**
   * Constructor
   *
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
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

    await oThis._setPayload();

    await oThis._publishForUserIds();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and Sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;
    let tx = oThis.transaction;

    logger.log('Start:: Validate for VideoAdd');

    if (
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_va_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }

    logger.log('End:: Validate for VideoAdd');
  }

  /**
   * Topic name for the job
   *
   * @return {Promise<void>}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.videoAdd;
  }

  /**
   * Set Payload for notification
   *
   * @return {Promise<void>}
   * @private
   */
  async _setPayload() {
    const oThis = this;
    logger.log('Start:: _setPayload for VideoAdd');

    oThis.payload = {
      subjectUserId: oThis.userId,
      videoId: oThis.videoId
    };

    logger.log('End:: _setPayload for VideoAdd');
  }

  /**
   * Get Contributors List and enqueue for them
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

      let rsp = oThis._fetchPaginatedUserIdsFromCache(pageNo);

      if (rsp.isFailure()) {
        return Promise.reject(rsp);
      }

      const contributorUserCount = rsp.contributionUserIds.length;

      if (contributorUserCount < 1) {
        break;
      }

      for (let i = 0; i < contributorUserCount; i++) {
        let contributorUserId = rsp.contributionUserIds[i];
        if (pageNo != 1 && lastId <= contributorUserId) {
          continue;
        }
        oThis.publishUserIds.push(contributorUserId);
      }

      lastId = rsp.contributionUserIds[contributorUserCount - 1];

      if (oThis.publishUserIds.length > 0) {
        await oThis._enqueueUserNotification();
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

    return responseHelper.successWithData({ contributionUserIds: userPaginationCacheRes.data });
  }
}

module.exports = VideoAdd;
