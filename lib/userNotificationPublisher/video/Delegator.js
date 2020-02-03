const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

class VideoDelegator {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.videoId
   * @param {array} params.mentionedUserIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.videoId = params.videoId;
    oThis.mentionedUserIds = params.mentionedUserIds || [];
    oThis.channelIds = [];

    oThis.channelIdToUserIdsMap = {};

    oThis.notificationKindToPublishDetailsMap = {
      [userNotificationConstants.userMentionKind]: [], // Array of objects { kind: 'channel', users: [], extraParams: {}, kind: 'user', users: [], extraParams: {}}
      [userNotificationConstants.videoAddKind]: [],
      [userNotificationConstants.videoAddInChannelKind]: []
    };
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._fetchChannelIds();

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
   * Fetch channel ids for given video id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelIds() {
    const oThis = this;

    const videoDetailsCacheResp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResp.isFailure()) {
      return Promise.reject(videoDetailsCacheResp);
    }

    const videoDetailsCacheRespData = videoDetailsCacheResp.data[oThis.videoId];

    oThis.channelIds = videoDetailsCacheRespData.channelIds;

    console.log(' oThis.channelIds =======', oThis.channelIds);
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

    if (oThis.channelIds.length > 0) {
      // TODO - channels: This can be cached.
      const channelUserModelResp = await new ChannelUserModel().fetchActiveUserIdsWithNotificationStatusOn(
        oThis.channelIds
      );

      oThis.channelIdToUserIdsMap = channelUserModelResp.channelIdToUserIdsMap;
    }

    // Remove muted user ids.
    supporterUserIds = await oThis._filterMutedUserIds(supporterUserIds);

    // At mention has highest priority.
    if (oThis.mentionedUserIds.length > 0) {
      oThis.mentionedUserIds = basicHelper.arrayDiff(oThis.mentionedUserIds, [oThis.userId]);

      if (oThis.channelIds.length > 0) {
        await oThis._setUserMentionNotificationData();
      } else {
        oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionKind].push({
          kind: oThis.userTypeNotification,
          userIds: oThis.mentionedUserIds,
          extraParams: {}
        });
      }

      supporterUserIds = basicHelper.arrayDiff(supporterUserIds, oThis.mentionedUserIds);
    }

    logger.log('supporterUserIds=======', supporterUserIds);

    let channelSupporterUserIds = [];
    // If user has supporters it has second priority.

    if (supporterUserIds.length > 0) {
      if (oThis.channelIds.length > 0) {
        channelSupporterUserIds = await oThis._getSupportersFromChannel(supporterUserIds);
        supporterUserIds = basicHelper.arrayDiff(supporterUserIds, channelSupporterUserIds);
      }

      // If channel id is not present other supporters should get video add notification.
      if (supporterUserIds.length > 0) {
        oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddKind].push({
          kind: oThis.userTypeNotification,
          userIds: supporterUserIds,
          extraParams: {}
        });
      }
    }

    // If channel id is present, then channel members will get notification.
    let channelUsers = [oThis.userId].concat(oThis.mentionedUserIds).concat(channelSupporterUserIds);

    if (oThis.channelIds.length > 0) {
      for (let channelId in oThis.channelIdToUserIdsMap) {
        let channelUserIds = oThis.channelIdToUserIdsMap[channelId];
        channelUserIds = basicHelper.arrayDiff(channelUserIds, channelUsers);

        if (channelUserIds.length > 0) {
          oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddInChannelKind].push({
            kind: oThis.channelTypeNotification,
            userIds: channelUserIds,
            extraParams: {
              channelId: channelId
            }
          });

          channelUsers.concat(channelUserIds);
        }
      }
    }
  }

  /**
   * Get channel mentions.
   *
   * @returns {Promise<[]>}
   * @private
   */
  async _setUserMentionNotificationData() {
    const oThis = this;

    oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionKind].push({
      kind: oThis.channelTypeNotification,
      userIds: oThis.mentionedUserIds,
      extraParams: {
        channelId: oThis.channelIds[0]
      }
    });
  }

  /**
   * Get supporters if they belong to some channel.
   *
   * @param supporters
   * @returns {Promise<[]>}
   * @private
   */
  async _getSupportersFromChannel(supporters) {
    const oThis = this;
    let channelSupporters = [];

    const channelIdToSupporterUserIdsMap = await new ChannelUserModel().fetchUserIdsForChannelIds(
      supporters,
      oThis.channelIds
    );

    for (let channelId in channelIdToSupporterUserIdsMap) {
      const channelUserIds = basicHelper.arrayDiff(channelIdToSupporterUserIdsMap[channelId], channelSupporters);

      oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddKind].push({
        kind: oThis.channelTypeNotification,
        userIds: channelUserIds,
        extraParams: {
          channelId: channelId
        }
      });

      channelSupporters = channelSupporters.concat(channelUserIds);
    }

    return channelSupporters;
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
    for (const notificationKind in oThis.notificationKindToPublishDetailsMap) {
      let publishDetails = oThis.notificationKindToPublishDetailsMap[notificationKind];

      if (!publishDetails.length) {
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
   * Enqueue notification based on kind.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueNotificationForKind(kind) {
    const oThis = this;

    logger.log('Start:: _enqueueNotificationForKind for VideoDelegator:: ', kind);

    const params = {
      userId: oThis.userId,
      videoId: oThis.videoId
    };

    switch (kind) {
      case userNotificationConstants.videoAddKind: {
        const promiseArray = [];
        const publishDetails = oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];
          params.publishUserIds = publishDetailsMap.userIds;

          if (publishDetailsMap.kind === oThis.channelTypeNotification) {
            params.channelId = publishDetailsMap.extraParams.channelId;
          }

          logger.log('_enqueueNotificationForKind params:: ', params);
          promiseArray.push(new oThis._videoAddClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
      }

      case userNotificationConstants.userMentionKind: {
        const promiseArray = [];
        const publishDetails = oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];
          params.publishUserIds = publishDetailsMap.userIds;

          if (publishDetailsMap.kind === oThis.channelTypeNotification) {
            params.channelId = publishDetailsMap.extraParams.channelId;
          }

          logger.log('_enqueueNotificationForKind params:: ', params);
          promiseArray.push(new oThis._userMentionInVideoClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
      }

      case userNotificationConstants.videoAddInChannelKind: {
        const promiseArray = [];
        const publishDetails =
          oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddInChannelKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];
          params.publishUserIds = publishDetailsMap.userIds;

          if (publishDetailsMap.kind === oThis.channelTypeNotification) {
            params.channelId = publishDetailsMap.extraParams.channelId;
          }
          logger.log('_enqueueNotificationForKind params:: ', params);
          promiseArray.push(new oThis._videoAddInChannelClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
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

  get _videoAddInChannelClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/ChannelAdd');
  }

  get channelTypeNotification() {
    return 'channel';
  }

  get userTypeNotification() {
    return 'user';
  }
}

module.exports = VideoDelegator;
