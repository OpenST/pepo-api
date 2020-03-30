const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  ChannelUsersByChannelIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ChannelUsersByChannelIdPagination'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for channel go live publishing.
 *
 * @class ChannelGoLive
 */
class ChannelGoLive extends UserNotificationPublisherBase {
  /**
   * Constructor for channel go live.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {number} params.meetingHostUserId
   * @param {number} params.meetingId
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channelId;
    oThis.meetingHostUserId = params.meetingHostUserId;
    oThis.meetingId = params.meetingId;
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

    await oThis._setPublishUserIds();

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

    logger.log('Start:: Validate for ChannelGoLive');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.channelId) ||
      !CommonValidators.validateNonZeroInteger(oThis.meetingHostUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.meetingId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_c_gl_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            channelId: oThis.channelId,
            meetingHostUserId: oThis.meetingHostUserId,
            meetingId: oThis.meetingId
          }
        })
      );
    }

    logger.log('End:: Validate for ChannelGoLive');
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
    logger.log('Start:: _setNotificationCentrePayload for ChannelGoLive');

    oThis.payload = {
      actorIds: [oThis.meetingHostUserId],
      actorCount: 1,
      subjectUserId: oThis.meetingHostUserId,
      payload: {
        channelId: oThis.channelId,
        meetingId: oThis.meetingId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ChannelGoLive');
  }

  /**
   * Set published user ids.
   *
   * @Sets oThis.publishUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setPublishUserIds() {
    const oThis = this;

    let pageNo = 1,
      lastId = -1;

    while (true) {
      const channelUsersPaginationCacheObj = new ChannelUsersByChannelIdPaginationCache({
          limit: paginationConstants.defaultUserContributionPageSize,
          page: pageNo,
          channelId: oThis.channelId
        }),
        channelUsersPaginationCacheRsp = await channelUsersPaginationCacheObj.fetch();

      if (channelUsersPaginationCacheRsp.isFailure()) {
        return Promise.reject(channelUsersPaginationCacheRsp);
      }

      const channelUsersCount = channelUsersPaginationCacheRsp.data.userIds.length;

      if (channelUsersCount < 1) {
        break;
      }

      for (let index = 0; index < channelUsersCount; index++) {
        const channelUserId = channelUsersPaginationCacheRsp.data.userIds[index],
          channelUserRow = channelUsersPaginationCacheRsp.data.channelUserDetails[channelUserId],
          channelUserRowId = channelUserRow.id;

        if (pageNo !== 1 && lastId <= channelUserRowId) {
          continue;
        }

        // Don't send notifications to meeting host/creator.
        // Don't send notifications, if channel user has muted the channel.
        if (
          channelUserId == oThis.meetingHostUserId ||
          channelUserRow.status !== channelUsersConstants.activeStatus ||
          channelUserRow.notificationStatus !== channelUsersConstants.activeNotificationStatus
        ) {
          continue;
        }

        oThis.publishUserIds.push(channelUserId);
      }

      logger.log('publishUserIds =====', oThis.publishUserIds);

      let lastUserId = channelUsersPaginationCacheRsp.data.userIds[channelUsersCount - 1];
      lastId = channelUsersPaginationCacheRsp.data.channelUserDetails[lastUserId].id;
      pageNo++;
    }
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.channelGoLiveNotificationKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.channelGoLiveNotificationKind;
  }
}

module.exports = ChannelGoLive;
