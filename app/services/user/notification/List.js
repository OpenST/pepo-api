const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  NotificationResponseHelper = require(rootPrefix + '/lib/notification/response/Helper'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserNotificationsByUserIdPagination = require(rootPrefix +
    '/lib/cacheManagement/single/UserNotificationsByUserIdPagination'),
  UpdateUserNotificationVisitDetailsService = require(rootPrefix +
    '/app/services/user/notification/UpdateUserNotificationVisitDetails'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for user notification list.
 *
 * @class UserNotificationList
 */
class UserNotificationList extends ServiceBase {
  /**
   * Constructor for user notification list.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = null;
    oThis.currentPageState = null;
    oThis.currentPageNumber = null;
    oThis.nextPageState = null;

    oThis.userNotifications = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.replyDetailIds = [];
    oThis.channelIds = [];
    oThis.imageIds = [];
    oThis.blockedByUserInfo = {};

    oThis.usersByIdMap = {};
    oThis.channelsByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.videoMap = {};
    oThis.replyDetailsMap = {};
    oThis.imageMap = {};

    oThis.formattedUserNotifications = [];
    oThis.notificationVideoMap = {};
    oThis.notificationsToDelete = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setUserNotifications();

    await oThis._setUserIdsVideoIdsAndReplyDetailIds();

    await oThis._fetchReplyDetails();

    const promisesArray = [
      oThis._fetchUsers(),
      oThis._fetchTokenUsers(),
      oThis._fetchVideos(),
      oThis._fetchBlockedByUserInfo(),
      oThis._fetchChannels()
    ];
    // Images are fetched later because video covers also needs to be fetched.

    await Promise.all(promisesArray);

    await oThis._fetchImages();

    await oThis._formatUserNotifications();

    await oThis._enqueueBackgroundTasks();

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.limit, oThis.currentPageState, oThis.currentPageNumber
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.currentPageState = parsedPaginationParams.page_state;
      oThis.currentPageNumber = parsedPaginationParams.page;
    } else {
      oThis.currentPageState = null;
      oThis.currentPageNumber = 1;
    }

    if (oThis.currentPageState) {
      if (!CommonValidators.validateNonZeroInteger(oThis.currentPageNumber) || oThis.currentPageNumber < 2) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_u_n_l_vas_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_pagination_identifier'],
            debug_options: { paginationIdentifier: oThis.paginationIdentifier }
          })
        );
      }
    }

    oThis.limit = paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Fetch user notifications from cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserNotifications() {
    const oThis = this;

    const cacheResponse = await new UserNotificationsByUserIdPagination({
      userId: oThis.currentUserId,
      limit: oThis.limit,
      pageState: oThis.currentPageState,
      pageNumber: oThis.currentPageNumber
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userNotifications = cacheResponse.data.userNotifications;
    oThis.nextPageState = cacheResponse.data.pageState;
  }

  /**
   * Find user ids, video ids and reply detail ids in the notifications.
   *
   * @sets oThis.userIds, oThis.videoIds, oThis.replyDetailIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserIdsVideoIdsAndReplyDetailIds() {
    const oThis = this;

    for (let index = 0; index < oThis.userNotifications.length; index++) {
      const userNotification = oThis.userNotifications[index];

      const supportingEntitiesConfig = NotificationResponseHelper.getSupportingEntitiesConfigForKind(
        userNotification.kind,
        oThis._notificationType
      );

      oThis.userIds = oThis.userIds.concat(
        oThis._getUserIdsForNotifications(userNotification, supportingEntitiesConfig)
      );

      oThis.videoIds = oThis.videoIds.concat(
        oThis._getVideoIdsForNotifications(userNotification, supportingEntitiesConfig)
      );

      oThis.replyDetailIds = oThis.replyDetailIds.concat(
        oThis._getReplyDetailIdsForNotifications(userNotification, supportingEntitiesConfig)
      );

      oThis.channelIds = oThis.channelIds.concat(
        oThis._getChannelIdsForNotifications(userNotification, supportingEntitiesConfig)
      );
    }

    oThis.userIds = [...new Set(oThis.userIds)];
    oThis.videoIds = [...new Set(oThis.videoIds)];
    oThis.replyDetailIds = [...new Set(oThis.replyDetailIds)];
    oThis.channelIds = [...new Set(oThis.channelIds)];
  }

  /**
   * Get user ids of supporting entity for a notifications.
   *
   * @returns {Promise<array>}
   * @private
   */
  _getUserIdsForNotifications(userNotification, supportingEntitiesConfig) {
    let uIds = [];

    const keysForUserId = supportingEntitiesConfig.userIds; // [['actorIds']]

    for (let index = 0; index < keysForUserId.length; index++) {
      const dataKeys = keysForUserId[index]; // ['actorIds']

      const val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);

      if (Array.isArray(val)) {
        uIds = uIds.concat(val);
      } else {
        uIds.push(Number(val));
      }
    }

    return uIds;
  }

  /**
   * Get video ids of supporting entity for a notifications.
   *
   * @returns {Promise<array>}
   * @private
   */
  _getVideoIdsForNotifications(userNotification, supportingEntitiesConfig) {
    const oThis = this;

    let vIds = [];

    const keysForVideoId = supportingEntitiesConfig.videoIds;

    for (let index = 0; index < keysForVideoId.length; index++) {
      const dataKeys = keysForVideoId[index];

      const val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);

      if (Array.isArray(val)) {
        vIds = vIds.concat(val);
      } else {
        vIds.push(Number(val));
      }
    }

    if (vIds.length > 0) {
      oThis.notificationVideoMap[userNotification.uuid] = vIds;
    }

    return vIds;
  }

  /**
   * Get video ids of supporting entity for a notifications.
   *
   * @returns {Promise<array>}
   * @private
   */
  _getReplyDetailIdsForNotifications(userNotification, supportingEntitiesConfig) {
    let rdIds = [];

    const keysForReplyDetailId = supportingEntitiesConfig.replyDetailIds;

    for (let index = 0; index < keysForReplyDetailId.length; index++) {
      const dataKeys = keysForReplyDetailId[index];

      const val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);

      if (Array.isArray(val)) {
        rdIds = rdIds.concat(val);
      } else {
        rdIds.push(Number(val));
      }
    }

    return rdIds;
  }

  /**
   * Get channel ids of supporting entity for a notifications.
   *
   * @returns {Promise<array>}
   * @private
   */
  _getChannelIdsForNotifications(userNotification, supportingEntitiesConfig) {
    let chIds = [];

    if (supportingEntitiesConfig.channelIds) {
      const keysForChannelId = supportingEntitiesConfig.channelIds;

      for (let index = 0; index < keysForChannelId.length; index++) {
        const dataKeys = keysForChannelId[index];

        const val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);

        if (val) {
          chIds.push(val);
        }
      }
    }

    return chIds;
  }

  /**
   * Fetch reply details
   *
   * @sets oThis.replyDetailsMap, oThis.videoIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReplyDetails() {
    const oThis = this;

    const replyDetailsByIdsCacheObj = new ReplyDetailsByIdsCache({
        ids: oThis.replyDetailIds
      }),
      cacheRsp = await replyDetailsByIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.replyDetailsMap = cacheRsp.data;

    for (const replyDetailId in oThis.replyDetailsMap) {
      const replyDetail = oThis.replyDetailsMap[replyDetailId];
      if (replyDetail.status === replyDetailConstants.deletedStatus) {
        delete oThis.replyDetailsMap[replyDetailId];
        continue;
      }
    }
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersByIdMap, oThis.imageIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.userIds.length < 1) {
      return;
    }

    const usersByIdHashRes = await new UserMultiCache({ ids: oThis.userIds }).fetch();
    if (usersByIdHashRes.isFailure()) {
      return Promise.reject(usersByIdHashRes);
    }

    oThis.usersByIdMap = usersByIdHashRes.data;

    for (const id in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[id];
      if (userObj.profileImageId) {
        oThis.imageIds.push(userObj.profileImageId);
      }
    }
  }

  /**
   * Fetch channels from cache.
   *
   * @sets oThis.channelsByIdMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchChannels() {
    const oThis = this;

    if (oThis.channelIds.length < 0) {
      return;
    }

    const channelByIdsCacheResp = await new ChannelByIdsCache({ ids: oThis.channelIds }).fetch();

    if (channelByIdsCacheResp.isFailure()) {
      return Promise.reject(channelByIdsCacheResp);
    }

    oThis.channelsByIdMap = channelByIdsCacheResp.data;
  }

  /**
   * Fetch token user details from cache.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length < 1) {
      return responseHelper.successWithData({});
    }

    const tokenUsersByIdHashRes = await new TokenUserByUserIdsMultiCache({
      userIds: oThis.userIds
    }).fetch();

    if (tokenUsersByIdHashRes.isFailure()) {
      return Promise.reject(tokenUsersByIdHashRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUsersByIdHashRes.data;
  }

  /**
   * Fetch videos.
   *
   * @sets oThis.videoMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    if (oThis.videoIds.length < 1) {
      return;
    }

    const cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.videoMap = cacheRsp.data;

    for (const videoId in oThis.videoMap) {
      const video = oThis.videoMap[videoId];
      if (video.status === videoConstants.deletedStatus) {
        delete oThis.videoMap[videoId];
        continue;
      }

      const posterImageId = video.posterImageId;
      if (posterImageId) {
        oThis.imageIds.push(posterImageId);
      }
    }
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length < 1) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Fetch list of users blocked by current user
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchBlockedByUserInfo() {
    const oThis = this;

    let cacheResp = await new UserBlockedListCache({ userId: oThis.currentUserId }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.blockedByUserInfo = cacheResp.data[oThis.currentUserId];
  }

  /**
   * Update notification centre last visit time.
   *
   * @returns {object}
   * @private
   */
  async _updateLastVisitedTime() {
    const oThis = this;

    if (oThis.currentPageState) {
      return;
    }

    const latestTimestamp = (oThis.formattedUserNotifications[0] || {}).lastActionTimestamp || Date.now();

    const updateParam = {
      user_id: oThis.currentUserId,
      last_visited_at: latestTimestamp
    };

    await new UpdateUserNotificationVisitDetailsService(updateParam).perform();
  }

  /**
   * Format notifications and update last visit time.
   *
   * @sets oThis.formattedUserNotifications
   *
   * @returns {Promise<never>}
   * @private
   */
  async _formatUserNotifications() {
    const oThis = this;

    for (let index = 0; index < oThis.userNotifications.length; index++) {
      const userNotification = oThis.userNotifications[index];

      if (oThis._isNotificationBlocked(userNotification)) {
        continue;
      }
      const formattedUserNotification = {
        id: NotificationResponseHelper.getEncryptIdForNotification(userNotification),
        kind: userNotification.kind,
        timestamp: userNotification.lastActionTimestamp,
        payload: await oThis._getPayload(userNotification),
        imageId: await oThis._getImageId(userNotification),
        goto: await oThis._getGoto(userNotification)
      };
      formattedUserNotification.heading = await oThis._getHeading(userNotification, formattedUserNotification.payload);

      oThis.formattedUserNotifications.push(formattedUserNotification);
    }

    await oThis._updateLastVisitedTime();
  }

  /**
   * Get image id for notifications.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getImageId(userNotification) {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: userNotification,
      notificationType: oThis._notificationType
    };

    const resp = NotificationResponseHelper.getImageIdForNotification(params);
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.imageId;
  }

  /**
   * Set payload for notifications.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getPayload(userNotification) {
    const oThis = this;

    const resp = NotificationResponseHelper.getPayloadDataForNotification({
      userNotification: userNotification,
      notificationType: oThis._notificationType
    });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.payload;
  }

  /**
   * Set heading for notifications.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getHeading(userNotification, payload) {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap,
        [responseEntityKey.channels]: oThis.channelsByIdMap
      },
      payload: payload,
      userNotification: userNotification,
      notificationType: oThis._notificationType
    };

    const resp = NotificationResponseHelper.getHeadingForNotification(params);
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.heading;
  }

  /**
   * Set goto for notifications.
   *
   * @param {object} userNotification
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getGoto(userNotification) {
    const oThis = this;

    const resp = NotificationResponseHelper.getGotoForNotification({
      userNotification: userNotification,
      notificationType: oThis._notificationType
    });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data;
  }

  /**
   * Check whether notification can be sent out or its blocked, due to some deleted entity.
   *
   * @param {object} userNotification
   *
   * @returns {boolean}
   * @private
   */
  _isNotificationBlocked(userNotification) {
    const oThis = this;

    let actorId = userNotification.actorIds[0],
      blockedNotificationsKindsMap = oThis._getBlockedNotificationsKinds();

    if (blockedNotificationsKindsMap[userNotification.kind]) {
      if (oThis.notificationVideoMap[userNotification.uuid]) {
        for (let index = 0; index < oThis.notificationVideoMap[userNotification.uuid].length; index++) {
          const vid = oThis.notificationVideoMap[userNotification.uuid][index];
          if (!CommonValidators.validateNonEmptyObject(oThis.videoMap[vid])) {
            // As video is not present in map, means its deleted so needs to clear activity.
            oThis.notificationsToDelete.push(userNotification);

            return true;
          }
        }
      }

      // If notification actor is inactive
      if (oThis.usersByIdMap[actorId].status === userConstants.inActiveStatus) {
        oThis.notificationsToDelete.push(userNotification);

        return true;
      }
    }

    // If notification actor is in user's blocked list then don't show notification
    // Or subject is in user's blocked list
    if (
      oThis.blockedByUserInfo.hasBlocked[actorId] ||
      oThis.blockedByUserInfo.blockedBy[actorId] ||
      oThis.blockedByUserInfo.hasBlocked[userNotification.subjectUserId] ||
      oThis.blockedByUserInfo.blockedBy[userNotification.subjectUserId]
    ) {
      oThis.notificationsToDelete.push(userNotification);
      return true;
    }

    return false;
  }

  /**
   * Enqueue background task.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueBackgroundTasks() {
    const oThis = this;

    if (oThis.notificationsToDelete.length > 0) {
      await bgJob.enqueue(bgJobConstants.deleteCassandraJobTopic, {
        tableName: new UserNotificationModel().tableName,
        elementsToDelete: oThis.notificationsToDelete
      });
    }
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const userHash = {},
      tokenUserHash = {};

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index],
        user = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId];
      userHash[userId] = new UserModel().safeFormattedData(user);
      tokenUserHash[userId] = new TokenUserModel().safeFormattedData(tokenUser);
    }

    const response = {
      usersByIdMap: userHash,
      tokenUsersByUserIdMap: tokenUserHash,
      imageMap: oThis.imageMap,
      videoMap: oThis.videoMap,
      replyDetailsMap: oThis.replyDetailsMap,
      userNotificationList: oThis.formattedUserNotifications,
      channelsMap: oThis.channelsByIdMap
    };

    const nextPagePayloadKey = {};

    if (oThis.nextPageState) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page_state: oThis.nextPageState,
        page: oThis.currentPageNumber + 1
      };
    }

    response.meta = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return response;
  }

  /**
   * Returns notification type.
   *
   * @returns {string}
   * @private
   */
  get _notificationType() {
    return userNotificationConstants.notificationCentreType;
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.defaultUserNotificationPageSize;
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }

  /**
   * Get blocked notifications kinds.
   *
   * @returns {{[p: string]: number}}
   * @private
   */
  _getBlockedNotificationsKinds() {
    return {
      [userNotificationConstants.videoAddKind]: 1,
      [userNotificationConstants.userMentionKind]: 1,
      [userNotificationConstants.replyUserMentionKind]: 1,
      [userNotificationConstants.youRepliedWithAmountKind]: 1,
      [userNotificationConstants.youRepliedWithoutAmountKind]: 1,
      [userNotificationConstants.replyOnYourVideoWithAmountKind]: 1,
      [userNotificationConstants.replyOnYourVideoWithoutAmountKind]: 1,
      [userNotificationConstants.replyThreadNotificationKind]: 1,
      [userNotificationConstants.videoAddInChannelKind]: 1,
      [userNotificationConstants.userMentionInChannelKind]: 1,
      [userNotificationConstants.videoAddSupportersAndChannelMembersKind]: 1
    };
  }
}

module.exports = UserNotificationList;
