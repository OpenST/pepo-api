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

/**
 * Class for video delegator.
 *
 * @class VideoDelegator
 */
class VideoDelegator {
  /**
   * Constructor for video add publishing.
   *
   * @param {object} params
   * @param {number} params.creatorUserId
   * @param {number} params.videoId
   * @param {array} params.mentionedUserIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.creatorUserId = params.creatorUserId;
    oThis.videoId = params.videoId;
    oThis.mentionedUserIds = params.mentionedUserIds || [];

    oThis.channelIds = [];
    oThis.channelIdToUserIdsMap = {};
    oThis.supporterUserIds = [];
    oThis.unmutedSupporterUserIds = [];
    oThis.alreadyConsideredRecipientsUserIds = [oThis.creatorUserId];

    oThis.notificationKindToPublishDetailsMap = {
      [userNotificationConstants.userMentionInChannelKind]: [], // Array of objects { userIds: [], extraParams: {}, userIds: [], extraParams: {}}
      [userNotificationConstants.userMentionKind]: [],
      [userNotificationConstants.videoAddSupportersAndChannelMembersKind]: [],
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

    await oThis._fetchChannelInfo();

    await oThis._fetchUserSupporters();

    // At mention has highest priority. It will be sent even if muted.
    await oThis._setMentionedUserNotificationRecipients();

    // We will remove the already considered user ids from supporter user ids.
    await oThis._setSupporterRecipients();

    // If channel id is present, then channel members will get notification.
    await oThis._setChannelRecipients();

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
      !CommonValidators.validateNonZeroInteger(oThis.creatorUserId) ||
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateArray(oThis.mentionedUserIds)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_v_d_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            creatorUserId: oThis.creatorUserId,
            videoId: oThis.videoId,
            mentionedUserIds: oThis.mentionedUserIds
          }
        })
      );
    }

    logger.log('End:: Validate for VideoDelegator');
  }

  /**
   * Fetch channel ids and their members
   *
   * @sets oThis.channelIds, oThis.channelIdToUserIdsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelInfo() {
    const oThis = this;

    const videoDetailsCacheResp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResp.isFailure()) {
      return Promise.reject(videoDetailsCacheResp);
    }

    const videoDetailsCacheRespData = videoDetailsCacheResp.data[oThis.videoId];

    oThis.channelIds = videoDetailsCacheRespData.channelIds;

    logger.log(' oThis.channelIds =======', oThis.channelIds);

    if (!oThis.channelIds.length) return;

    // TODO - channels: This can be cached.
    const channelUserModelResp = await new ChannelUserModel().fetchActiveUserIdsWithNotificationStatusOn(
      oThis.channelIds
    );

    oThis.channelIdToUserIdsMap = channelUserModelResp.channelIdToUserIdsMap;
    logger.log(' oThis.channelIdToUserIdsMap =======', oThis.channelIdToUserIdsMap);
  }

  /**
   * Fetch supporters for particular user.
   *
   * @returns {Promise<[]>}
   * @private
   */
  async _fetchUserSupporters() {
    const oThis = this;

    let pageNo = 1,
      lastId = -1;

    while (true) {
      const UserContributedByPaginationCacheObj = new UserContributorByUserIdPaginationCache({
          limit: paginationConstants.defaultUserContributionPageSize,
          page: pageNo,
          userId: oThis.creatorUserId
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
        oThis.supporterUserIds.push(contributorUserId);
      }

      logger.log('supporterUserIds =====', oThis.supporterUserIds);

      let lastUserId = userPaginationCacheRes.data.contributedByUserIds[contributorUserCount - 1];
      lastId = userPaginationCacheRes.data.contributionUsersByUserIdsMap[lastUserId].id;
      pageNo++;
    }
  }

  /**
   * Mentioned user notification recipients.
   *
   * @private
   */
  async _setMentionedUserNotificationRecipients() {
    const oThis = this;

    if (oThis.mentionedUserIds.length === 0) return;

    if (oThis.channelIds.length) {
      // Fetch channel members with notification status on from mentioned user ids.
      const channelIdToMentionedUserIdsMap = await new ChannelUserModel().fetchUserIdsForChannelIds(
        oThis.mentionedUserIds,
        oThis.channelIds
      );

      // Two cases - channel ids present or not. if present, we need to send channel name in the text.
      for (let channelId in channelIdToMentionedUserIdsMap) {
        const mentionedChannelUserIds = basicHelper.arrayDiff(
          channelIdToMentionedUserIdsMap[channelId],
          oThis.alreadyConsideredRecipientsUserIds
        );

        oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionInChannelKind].push({
          userIds: mentionedChannelUserIds,
          extraParams: {
            channelId: channelId
          }
        });

        oThis.alreadyConsideredRecipientsUserIds = oThis.alreadyConsideredRecipientsUserIds.concat(
          mentionedChannelUserIds
        );
      }
    }

    const remainingMentionedUserIds = basicHelper.arrayDiff(
      oThis.mentionedUserIds,
      oThis.alreadyConsideredRecipientsUserIds
    );

    if (remainingMentionedUserIds.length) {
      oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionKind].push({
        userIds: remainingMentionedUserIds,
        extraParams: {}
      });
    }

    oThis.alreadyConsideredRecipientsUserIds = oThis.alreadyConsideredRecipientsUserIds.concat(
      remainingMentionedUserIds
    );
  }

  /**
   * Set supporters recipients.
   *
   * @return {Promise<void>}
   * @private
   */
  async _setSupporterRecipients() {
    const oThis = this;

    // Supporters who have muted the video creator are of no relevance here in context of notification.
    oThis.unmutedSupporterUserIds = await oThis._filterMutedUserIds(oThis.supporterUserIds);

    logger.log(' ======= oThis.unmutedSupporterUserIds', oThis.unmutedSupporterUserIds);

    if (!oThis.unmutedSupporterUserIds.length) return;

    let recipientCandidatesInSupporters = basicHelper.arrayDiff(
      oThis.unmutedSupporterUserIds,
      oThis.alreadyConsideredRecipientsUserIds
    );

    logger.log(' ======= recipientCandidatesInSupporters', recipientCandidatesInSupporters);

    if (!recipientCandidatesInSupporters.length) return;

    // If user has supporters it has second priority.
    if (oThis.channelIds.length) {
      await oThis._setSupporterFromChannelRecipients(recipientCandidatesInSupporters);
      recipientCandidatesInSupporters = basicHelper.arrayDiff(
        recipientCandidatesInSupporters,
        oThis.alreadyConsideredRecipientsUserIds
      );
    }

    if (!recipientCandidatesInSupporters.length) return;

    // If channel id is not present other supporters should get video add notification.
    oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddKind].push({
      userIds: recipientCandidatesInSupporters,
      extraParams: {}
    });

    oThis.alreadyConsideredRecipientsUserIds = oThis.alreadyConsideredRecipientsUserIds.concat(
      recipientCandidatesInSupporters
    );
  }

  /**
   * Set channel recipients.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setChannelRecipients() {
    const oThis = this;

    if (!oThis.channelIds.length) return;

    for (let channelId in oThis.channelIdToUserIdsMap) {
      let channelUserIds = oThis.channelIdToUserIdsMap[channelId],
        userToUserUnmutedChannelUserIds = await oThis._filterMutedUserIds(channelUserIds);

      userToUserUnmutedChannelUserIds = basicHelper.arrayDiff(
        userToUserUnmutedChannelUserIds,
        oThis.alreadyConsideredRecipientsUserIds
      );

      if (userToUserUnmutedChannelUserIds.length > 0) {
        oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddInChannelKind].push({
          userIds: userToUserUnmutedChannelUserIds,
          extraParams: {
            channelId: channelId
          }
        });

        // We can add channelUserIds to all recipient user ids directly,
        // because anyway userToUserUnmutedChannelUserIds is subset of channelUserIds.
        oThis.alreadyConsideredRecipientsUserIds = oThis.alreadyConsideredRecipientsUserIds.concat(
          userToUserUnmutedChannelUserIds
        );
      }
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
   * Get supporters if they belong to some channel.
   *
   * @param supporters
   * @returns {Promise<[]>}
   * @private
   */
  async _setSupporterFromChannelRecipients(supporters) {
    const oThis = this;

    const channelIdToSupporterUserIdsMap = await new ChannelUserModel().fetchUserIdsForChannelIds(
      supporters,
      oThis.channelIds
    );

    for (let channelId in channelIdToSupporterUserIdsMap) {
      const channelUserIds = basicHelper.arrayDiff(
        channelIdToSupporterUserIdsMap[channelId],
        oThis.alreadyConsideredRecipientsUserIds
      );

      oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddSupportersAndChannelMembersKind].push(
        {
          userIds: channelUserIds,
          extraParams: {
            channelId: channelId
          }
        }
      );

      oThis.alreadyConsideredRecipientsUserIds = oThis.alreadyConsideredRecipientsUserIds.concat(channelUserIds);
    }
  }

  /**
   * Filter muted user ids.
   *
   * @param userIds
   * @returns {Promise<[]|Array>}
   * @private
   */
  async _filterMutedUserIds(userIds) {
    const oThis = this;

    if (!userIds.length) return [];

    const userMuteByUser1IdsResp = await new UserMuteByUser1IdsCache({ user1Ids: userIds }).fetch();

    if (userMuteByUser1IdsResp.isFailure()) {
      return Promise.reject(userMuteByUser1IdsResp);
    }

    const userMuteByUser1IdsRespData = userMuteByUser1IdsResp.data,
      unmutedUserIds = [];

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];

      // If current user id is muted by any of publishUserIds, remove it.
      if (!userMuteByUser1IdsRespData[userId] || !userMuteByUser1IdsRespData[userId][oThis.creatorUserId]) {
        unmutedUserIds.push(userId);
      }
    }

    return unmutedUserIds;
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
      userId: oThis.creatorUserId,
      videoId: oThis.videoId
    };

    switch (kind) {
      case userNotificationConstants.userMentionInChannelKind: {
        const promiseArray = [],
          publishDetails =
            oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionInChannelKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];

          Object.assign(params, {
            publishUserIds: publishDetailsMap.userIds,
            channelId: publishDetailsMap.extraParams.channelId
          });

          logger.log(
            '_enqueueNotificationForKind params:: with kind:',
            userNotificationConstants.userMentionInChannelKind,
            '==',
            params
          );

          promiseArray.push(new oThis._userMentionInChannelClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
      }

      case userNotificationConstants.userMentionKind: {
        const promiseArray = [],
          publishDetails = oThis.notificationKindToPublishDetailsMap[userNotificationConstants.userMentionKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];

          Object.assign(params, { publishUserIds: publishDetailsMap.userIds });

          logger.log(
            '_enqueueNotificationForKind params:: with kind:',
            userNotificationConstants.userMentionKind,
            '==',
            params
          );

          promiseArray.push(new oThis._userMentionInVideoClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
      }

      case userNotificationConstants.videoAddSupportersAndChannelMembersKind: {
        const promiseArray = [],
          publishDetails =
            oThis.notificationKindToPublishDetailsMap[
              userNotificationConstants.videoAddSupportersAndChannelMembersKind
            ];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];

          Object.assign(params, {
            publishUserIds: publishDetailsMap.userIds,
            channelId: publishDetailsMap.extraParams.channelId
          });

          logger.log(
            '_enqueueNotificationForKind params:: with kind:',
            userNotificationConstants.videoAddSupportersAndChannelMembersKind,
            '==',
            params
          );

          promiseArray.push(new oThis._videoAddSupportersAndChannelMembersClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
      }

      case userNotificationConstants.videoAddKind: {
        const promiseArray = [],
          publishDetails = oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];

          Object.assign(params, { publishUserIds: publishDetailsMap.userIds });

          logger.log(
            '_enqueueNotificationForKind params:: with kind:',
            userNotificationConstants.videoAddKind,
            '==',
            params
          );

          promiseArray.push(new oThis._videoAddClass(params).perform());
        }

        await Promise.all(promiseArray);
        return;
      }

      case userNotificationConstants.videoAddInChannelKind: {
        const promiseArray = [],
          publishDetails = oThis.notificationKindToPublishDetailsMap[userNotificationConstants.videoAddInChannelKind];

        for (let index = 0; index < publishDetails.length; index++) {
          const publishDetailsMap = publishDetails[index];

          Object.assign(params, {
            publishUserIds: publishDetailsMap.userIds,
            channelId: publishDetailsMap.extraParams.channelId
          });

          logger.log(
            '_enqueueNotificationForKind params:: with kind:',
            userNotificationConstants.videoAddInChannelKind,
            '==',
            params
          );

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

  get _userMentionInChannelClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/UserMentionWithChannelName');
  }

  get _userMentionInVideoClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/UserMention');
  }

  get _videoAddSupportersAndChannelMembersClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/AddForSupportersAndChannelMembers');
  }

  get _videoAddClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/Add');
  }

  get _videoAddInChannelClass() {
    return require(rootPrefix + '/lib/userNotificationPublisher/video/ChannelAdd');
  }
}

module.exports = VideoDelegator;
