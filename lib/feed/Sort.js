const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  headerHelper = require(rootPrefix + '/helpers/header'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Sort.
 *
 * @class Sort
 */
class Sort {
  /**
   * Constructor for sort unseen feed.
   *
   * @param {number} params.currentUserId
   * @param {Object} params.blockedUserInfo
   * @param {Object} params.muteByUserMap
   * @param {Object} params.mutedByAdminMap
   * @param {Object} params.allFeedMap
   * @param {array} params.allFeedIds
   * @param {array} params.allUserIds
   * @param {array} params.allVideoIds
   * @param {Object} params.twitterConnectionsMap
   * @param {Object} params.videoViewMap
   * @param {Object} params.userVideoActionMap
   * @param {object} params.userUserActionMap
   * @param {object} params.videoDetailMap
   * @param {array} params.joinedChannelIdMap
   * @param {object} params.headers
   * @param {string} params.apiSource
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    //Note: It can be called for logged out feed as well

    oThis.currentUserId = params.currentUserId;
    oThis.blockedUserInfo = params.blockedUserInfo;
    oThis.muteByUserMap = params.muteByUserMap;
    oThis.mutedByAdminMap = params.mutedByAdminMap;
    oThis.allFeedMap = params.allFeedMap;
    oThis.allFeedIds = params.allFeedIds;
    oThis.allUserIds = params.allUserIds;
    oThis.allVideoIds = params.allVideoIds;
    oThis.twitterConnectionsMap = params.twitterConnectionsMap;
    oThis.videoViewMap = params.videoViewMap;
    oThis.userVideoActionMap = params.userVideoActionMap;
    oThis.userUserActionMap = params.userUserActionMap;
    oThis.videoDetailMap = params.videoDetailMap;
    oThis.joinedChannelIdMap = params.joinedChannelIdMap;
    oThis.headers = params.headers;
    oThis.apiSource = params.apiSource;

    oThis.isReplyBuild = false;
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    if (oThis.currentUserId) {
      return oThis._performForLoggedInFeed();
    } else {
      return oThis._performForLoggedOutFeed();
    }
  }

  /**
   * Main method for logged in feed.
   *
   * @returns {Promise<void>}
   */
  async _performForLoggedInFeed() {
    const oThis = this;

    let sortFeed = false;

    if (apiSourceConstants.isWebRequest(oThis.apiSource)) {
      oThis.isReplyBuild = true;
      sortFeed = true;
    } else {
      if (headerHelper.isReplyBuild(oThis.headers)) {
        oThis.isReplyBuild = true;
        sortFeed = true;
      } else if (headerHelper.isVideoPlayEventBuild(oThis.headers)) {
        sortFeed = true;
      }
    }

    logger.info('Is reply build ====== ', oThis.isReplyBuild);
    logger.info('Is video play event build ====== ', sortFeed);

    if (sortFeed) {
      return oThis._performSort();
    } else {
      return oThis._performForOlderDevicesWithoutSort();
    }
  }

  /**
   * Main method for logged out feed.
   *
   * @returns {Promise<void>}
   */
  async _performForLoggedOutFeed() {
    const oThis = this;

    const sortData = {
      popular: [],
      unpopular: []
    };

    for (let i = 0; i < oThis.allFeedIds.length; i++) {
      const feedId = oThis.allFeedIds[i],
        feedObj = oThis.allFeedMap[feedId],
        actorId = feedObj.actor;

      const isPopularFeed = oThis._isPopular(feedObj);

      if (oThis._isLoggingEnabled()) {
        logger.info(`\n------------FEED DATA FOR FEED ID: ${feedId} ---LOGGED OUT USER-----------
      isPopularFeed:${isPopularFeed}
      actorId:${actorId}
            `);
      }

      if (oThis.mutedByAdminMap[actorId]) {
        //muted users video should not come on logged out feed
        continue;
      }

      if (isPopularFeed) {
        // Popular video.
        sortData.popular.push(feedId);
      } else if (true) {
        // UnPopular video.
        sortData.unpopular.push(feedId);
      }
    }

    const unpopularFeedIds = oThis._getFeedIdsWithUniquenessCategory(sortData.unpopular, 'unpopular');

    // Note: Reverse the order as the order of above loop was based on oldest feed first
    oThis._sortFeedsOnPopularityScore(sortData.popular, 'popular');

    if (oThis._isLoggingEnabled()) {
      logger.info(`\n================sortData:${JSON.stringify(sortData)} ------------\n`);
      logger.info(`\n================unpopularFeedIds:${unpopularFeedIds} ------------\n`);
    }

    const sortedFeedIds = sortData.popular.concat(unpopularFeedIds);

    const lastFeedId = oThis.allFeedIds[oThis.allFeedIds.length - 1];
    const oldestFeedObj = oThis.allFeedMap[lastFeedId] || {},
      lastPaginationTimestamp = oldestFeedObj.paginationIdentifier;

    if (oThis._isLoggingEnabled()) {
      logger.info(`\n================lastPaginationTimestamp:${lastPaginationTimestamp}------------\n`);
    }

    return responseHelper.successWithData({
      allSortedFeedIds: sortedFeedIds,
      lastPaginationTimestamp: lastPaginationTimestamp
    });
  }

  /**
   * Main method for old devices without video play event.
   *
   * @returns {Promise<void>}
   */
  async _performSort() {
    const oThis = this;

    //Categories which should have only one video from a user. Only The oldest video should come.
    // If video belongs to category 7 and category 11 etc, and video is skipped for category 7 due to uniqueness, then still goes into category 11

    const popularitySortCategories = {
      category17: 1,
      category19: 1,
      category20: 1,
      category22: 1,
      category23: 1,
      category25: 1
    };

    const uniqueActorVideosData = {
      category7: {},
      category11: {},
      category15: {},
      category16: {},
      category18: {},
      category21: {},
      category24: {},
      category26: {}
    };

    const sortData = {
      category1: [],
      category2: [],
      category3: [],
      category4: [],
      category5: [],
      category6: [],
      category7: [],
      category8: [],
      category9: [],
      category10: [],
      category11: [],
      category12: [],
      category13: [],
      category14: [],
      category15: [],
      category16: [],
      category17: [],
      category18: [],
      category19: [],
      category20: [],
      category21: [],
      category22: [],
      category23: [],
      category24: [],
      category25: [],
      category26: []
    };

    for (let i = 0; i < oThis.allFeedIds.length; i++) {
      const feedId = oThis.allFeedIds[i],
        feedObj = oThis.allFeedMap[feedId],
        videoId = feedObj.primaryExternalEntityId,
        actorId = feedObj.actor;

      const isUnseenVideo = oThis._isUnseenVideo(videoId),
        isMyVideo = oThis._isCurrentUser(actorId),
        isPopularFeed = oThis._isPopular(feedObj),
        hasContributedToAuthor = oThis._hasContributedToUser(actorId),
        hasNotSeenMyLastReply = oThis._hasNotSeenMyLastReply(feedId);

      let hasNewReplyByOtherUsers = false,
        iHaveReplied = false,
        isJoinedChannelVideo = false;

      // If user doesn't have reply build, then no need to republish videos by replies.
      if (oThis.isReplyBuild) {
        hasNewReplyByOtherUsers = oThis._hasNewReplyByOtherUser(feedId);
        isJoinedChannelVideo = oThis._isJoinedChannelVideo(videoId);
        iHaveReplied = oThis._lastReplyTimestampByCurrentUserOnVideo(videoId) > 0;
      }

      if (oThis._isLoggingEnabled()) {
        logger.info(`\n------------FEED DATA FOR FEED ID: ${feedId} ---oThis.currentUserId:${
          oThis.currentUserId
        }-----------
      isMyVideo:${isMyVideo}
      isJoinedChannelVideo:${isJoinedChannelVideo}
      lastReplyTimestampOnFeed: ${oThis._lastReplyTimestampOnFeed(feedObj)}
      hasNotSeenMyLastReply: ${hasNotSeenMyLastReply}
      isUnseenVideo:${isUnseenVideo} 
      hasNewReplyByOtherUsers:${hasNewReplyByOtherUsers} 
      isPopularFeed:${isPopularFeed}
      actorId:${actorId}
      videoLastSeenTimestamp:${oThis._videoLastSeenTimestamp(videoId)}
      lastReplyTimestampByCurrentUserOnVideo:${oThis._lastReplyTimestampByCurrentUserOnVideo(videoId)}
      hasContributedToUser:${hasContributedToAuthor}
      hasContributedToVideo:${oThis._hasContributedToVideo(videoId)}
      hasContributedToReplyOnVideo:${oThis._hasContributedToReplyOnVideo(videoId)}
      _isFollowingOnTwitter:${oThis._isFollowingOnTwitter(actorId)}
      `);
      }

      if (oThis._isBlocked(actorId) || oThis._isMutedByCurrentUser(actorId) || oThis._isGlobalMute(actorId)) {
        // Blocked users and muted users video should not come on feed
        continue;
      }

      if (isUnseenVideo && isMyVideo) {
        // My unseen videos.
        sortData.category1.push(feedId);
      } else if (iHaveReplied && hasNotSeenMyLastReply) {
        // My Unseen Reply
        sortData.category2.push(feedId);
      } else if (isMyVideo && hasNewReplyByOtherUsers && isJoinedChannelVideo) {
        // My video and has a new reply and isJoinedChannelVideo. (Republish on top)
        sortData.category3.push(feedId);
      } else if (isMyVideo && hasNewReplyByOtherUsers) {
        // My video and has a new reply. (Republish on top)
        sortData.category4.push(feedId);
      } else if (iHaveReplied && hasNewReplyByOtherUsers && isJoinedChannelVideo) {
        // I had replied to a video and has a new reply and isJoinedChannelVideo. (Republish on top)
        sortData.category5.push(feedId);
      } else if (iHaveReplied && hasNewReplyByOtherUsers) {
        // I had replied to a video and has a new reply. (Republish on top)
        sortData.category6.push(feedId);
      } else if (
        isUnseenVideo &&
        hasContributedToAuthor &&
        (!uniqueActorVideosData['category7'][actorId] || uniqueActorVideosData['category7'][actorId].length < 5) &&
        isJoinedChannelVideo
      ) {
        //Note: uniqueActorVideosData['category7'][actorId] will be undefined or array with 1 element
        // Unseen video from author's I have contributed to and isJoinedChannelVideo. ----------------------------
        sortData.category7.push(feedId);
        uniqueActorVideosData['category7'][actorId] = uniqueActorVideosData['category7'][actorId] || [];
        uniqueActorVideosData['category7'][actorId].push(feedId);
      } else if (oThis._hasContributedToVideo(videoId) && hasNewReplyByOtherUsers && isJoinedChannelVideo) {
        // Video Contributor and has a new reply and isJoinedChannelVideo. (Republish on top)
        sortData.category8.push(feedId);
      } else if (oThis._hasContributedToReplyOnVideo(videoId) && hasNewReplyByOtherUsers && isJoinedChannelVideo) {
        // Reply Contributor and has a new reply and isJoinedChannelVideo. (Republish on top)
        sortData.category9.push(feedId);
      } else if (hasContributedToAuthor && hasNewReplyByOtherUsers && isJoinedChannelVideo) {
        // Video from Author's i have Contributed to and has a new reply and isJoinedChannelVideo. (Republish on top)
        sortData.category10.push(feedId);
      } else if (
        isUnseenVideo &&
        hasContributedToAuthor &&
        (!uniqueActorVideosData['category11'][actorId] || uniqueActorVideosData['category11'][actorId].length < 5)
      ) {
        // Unseen video from author's I have contributed to. ----------------------------
        sortData.category11.push(feedId);
        uniqueActorVideosData['category11'][actorId] = uniqueActorVideosData['category11'][actorId] || [];
        uniqueActorVideosData['category11'][actorId].push(feedId);
      } else if (oThis._hasContributedToVideo(videoId) && hasNewReplyByOtherUsers) {
        // Video Contributor and has a new reply. (Republish on top)
        sortData.category12.push(feedId);
      } else if (oThis._hasContributedToReplyOnVideo(videoId) && hasNewReplyByOtherUsers) {
        // Reply Contributor and has a new reply. (Republish on top)
        sortData.category13.push(feedId);
      } else if (hasContributedToAuthor && hasNewReplyByOtherUsers) {
        // Video from Author's i have Contributed to and has a new reply. (Republish on top)
        sortData.category14.push(feedId);
      } else if (
        isUnseenVideo &&
        oThis._isFollowingOnTwitter(actorId) &&
        isJoinedChannelVideo &&
        (!uniqueActorVideosData['category15'][actorId] || uniqueActorVideosData['category15'][actorId].length < 5)
      ) {
        // Unseen videos from people I follow on Twitter and isJoinedChannelVideo.
        sortData.category15.push(feedId);
        uniqueActorVideosData['category15'][actorId] = uniqueActorVideosData['category15'][actorId] || [];
        uniqueActorVideosData['category15'][actorId].push(feedId);
      } else if (
        isUnseenVideo &&
        oThis._isFollowingOnTwitter(actorId) &&
        (!uniqueActorVideosData['category16'][actorId] || uniqueActorVideosData['category16'][actorId].length < 5)
      ) {
        // Unseen videos from people I follow on Twitter.
        sortData.category16.push(feedId);
        uniqueActorVideosData['category16'][actorId] = uniqueActorVideosData['category16'][actorId] || [];
        uniqueActorVideosData['category16'][actorId].push(feedId);
      } else if (isUnseenVideo && isPopularFeed && isJoinedChannelVideo) {
        // Unseen videos which are popular and isJoinedChannelVideo.
        sortData.category17.push(feedId);
      } else if (
        isUnseenVideo &&
        isJoinedChannelVideo &&
        (!uniqueActorVideosData['category18'][actorId] || uniqueActorVideosData['category18'][actorId].length < 5)
      ) {
        // Unseen videos and isJoinedChannelVideo.
        sortData.category18.push(feedId);
        uniqueActorVideosData['category18'][actorId] = uniqueActorVideosData['category18'][actorId] || [];
        uniqueActorVideosData['category18'][actorId].push(feedId);
      } else if (isPopularFeed && hasNewReplyByOtherUsers && isJoinedChannelVideo) {
        // Popular video and isJoinedChannelVideo.
        // It should already be seen as the above condition in if is present.
        sortData.category19.push(feedId);
      } else if (isUnseenVideo && isPopularFeed) {
        // Unseen videos which are popular.
        sortData.category20.push(feedId);
      } else if (
        isUnseenVideo &&
        (!uniqueActorVideosData['category21'][actorId] || uniqueActorVideosData['category21'][actorId].length < 5)
      ) {
        // Unseen videos.
        sortData.category21.push(feedId);
        uniqueActorVideosData['category21'][actorId] = uniqueActorVideosData['category21'][actorId] || [];
        uniqueActorVideosData['category21'][actorId].push(feedId);
      } else if (isPopularFeed && hasNewReplyByOtherUsers) {
        // Popular video.
        // It should already be seen as the above condition in if is present.
        sortData.category22.push(feedId);
      } else if (isPopularFeed && isJoinedChannelVideo) {
        // Popular video and isJoinedChannelVideo.
        sortData.category23.push(feedId);
      } else if (isJoinedChannelVideo) {
        // UnPopular video and isJoinedChannelVideo.
        uniqueActorVideosData['category24'][actorId] = uniqueActorVideosData['category24'][actorId] || [];
        uniqueActorVideosData['category24'][actorId].push(feedId);
        sortData.category24.push(feedId);
      } else if (isPopularFeed) {
        // Popular video.
        sortData.category25.push(feedId);
      } else {
        // UnPopular video.
        uniqueActorVideosData['category26'][actorId] = uniqueActorVideosData['category26'][actorId] || [];
        uniqueActorVideosData['category26'][actorId].push(feedId);
        sortData.category26.push(feedId);
      }
    }

    if (oThis._isLoggingEnabled()) {
      logger.info(`\n================sortData BEFORE:  ${JSON.stringify(sortData)} ------------\n`);

      logger.info(
        `\n================popularitySortCategories:  ${JSON.stringify(popularitySortCategories)} ------------\n`
      );

      logger.info(`\n================uniqueActorVideosData:  ${JSON.stringify(uniqueActorVideosData)} ------------\n`);
    }

    for (let categoryType in sortData) {
      const feedIds = sortData[categoryType];
      if (popularitySortCategories[categoryType]) {
        //Note: Pass By reference. Hence no need to reassign
        oThis._sortFeedsOnPopularityScore(feedIds, categoryType);
      } else if (uniqueActorVideosData[categoryType]) {
        if (categoryType == 'category24' || categoryType == 'category26') {
          oThis._sortFeedsOnPopularityScore(feedIds, categoryType);
        }

        sortData[categoryType] = oThis._getFeedIdsWithUniquenessCategory(feedIds, categoryType);
      }
    }

    if (oThis._isLoggingEnabled()) {
      logger.info(`\n================sortData AFTER:   ${JSON.stringify(sortData)} ------------\n`);
    }

    const sortedFeedIds = sortData.category1.concat(
      sortData.category2,
      sortData.category3,
      sortData.category4,
      sortData.category5,
      sortData.category6,
      sortData.category7,
      sortData.category8,
      sortData.category9,
      sortData.category10,
      sortData.category11,
      sortData.category12,
      sortData.category13,
      sortData.category14,
      sortData.category15,
      sortData.category16,
      sortData.category17,
      sortData.category18,
      sortData.category19,
      sortData.category20,
      sortData.category21,
      sortData.category22,
      sortData.category23,
      sortData.category24,
      sortData.category25,
      sortData.category26
    );

    const lastFeedId = oThis.allFeedIds[oThis.allFeedIds.length - 1];
    const oldestFeedObj = oThis.allFeedMap[lastFeedId] || {},
      lastPaginationTimestamp = oldestFeedObj.paginationIdentifier;

    if (oThis._isLoggingEnabled()) {
      logger.info(`\n================lastPaginationTimestamp:${lastPaginationTimestamp}------------\n`);
    }

    return responseHelper.successWithData({
      allSortedFeedIds: sortedFeedIds,
      lastPaginationTimestamp: lastPaginationTimestamp
    });
  }

  /**
   * method to get feed Ids for unpopular category. One video(Most popular) of a user will be included.
   *
   * @returns {Promise<void>}
   */
  _getFeedIdsWithUniquenessCategory(sortedFeedIds, categoryType) {
    const oThis = this;

    if (sortedFeedIds.length === 0) {
      return sortedFeedIds;
    }

    const feedIdWithLevelMap = {},
      actorVideoCount = {};

    for (let i = 0; i < sortedFeedIds.length; i++) {
      const feedId = sortedFeedIds[i],
        feedObj = oThis.allFeedMap[feedId],
        actorId = feedObj.actor;

      const level = actorVideoCount[actorId] || 0;
      if (level >= 5) {
        continue;
      }
      actorVideoCount[actorId] = level + 1;

      feedIdWithLevelMap[level] = feedIdWithLevelMap[level] || [];
      feedIdWithLevelMap[level].push(feedId);
    }

    let orderedFeedIds = [],
      level = 0;

    while (true) {
      const levelFeedIds = feedIdWithLevelMap[level];

      if (!levelFeedIds || levelFeedIds.length === 0) {
        break;
      }

      orderedFeedIds = orderedFeedIds.concat(levelFeedIds);

      if (levelFeedIds.length === 1) {
        break;
      }

      level++;
    }

    if (oThis._isLoggingEnabled()) {
      logger.info(`
      ============UNIQUENESS ${categoryType}============
      FeedIdsToSort :${sortedFeedIds}\\n\`);
      feedIdWithLevelMap :${JSON.stringify(feedIdWithLevelMap)}
      orderedFeedIds :${orderedFeedIds}\n`);
    }

    return orderedFeedIds;
  }

  /**
   * Main method for old devices without video play event.
   *
   * @returns {Promise<void>}
   */
  async _performForOlderDevicesWithoutSort() {
    const oThis = this;

    const sortedFeedIds = [];
    let lastPaginationTimestamp = null;

    for (let i = 0; i < oThis.allFeedIds.length; i++) {
      const feedId = oThis.allFeedIds[i],
        feedObj = oThis.allFeedMap[feedId],
        actorId = feedObj.actor;

      lastPaginationTimestamp = feedObj.paginationIdentifier;

      if (oThis._isBlocked(actorId) || oThis._isMutedByCurrentUser(actorId) || oThis._isGlobalMute(actorId)) {
        //  DO Not Show In Feeds
      } else {
        sortedFeedIds.push(feedId);
      }
    }

    return responseHelper.successWithData({
      allSortedFeedIds: sortedFeedIds,
      lastPaginationTimestamp: lastPaginationTimestamp
    });
  }

  //-------------------------- Helper methods --------------------------------

  /**
   * method to sort feeds based on its publish time
   *
   * @returns {Promise<void>}
   */
  _sortFeedsOnPublishTime(feedIds) {
    const oThis = this;

    const feedScore = {};

    for (let i = 0; i < feedIds.length; i++) {
      const feedId = feedIds[i],
        feedObj = oThis.allFeedMap[feedId];
      feedScore[feedId] = Number(feedObj.paginationIdentifier);
    }

    feedIds.sort(function(a, b) {
      return feedScore[b] - feedScore[a];
    });

    return feedIds;
  }

  /**
   * method to sort feeds based on its popularity score
   *
   * @returns {Promise<void>}
   */
  _sortFeedsOnPopularityScore(feedIds, categoryType) {
    const oThis = this;

    if (feedIds.length === 0) {
      return feedIds;
    }

    const feedScore = {};

    for (let i = 0; i < feedIds.length; i++) {
      const feedId = feedIds[i];

      const score = oThis._videoScore(feedId);
      feedScore[feedId] = score;
    }

    feedIds.sort(function(a, b) {
      return feedScore[b] - feedScore[a];
    });

    if (oThis._isLoggingEnabled()) {
      logger.info(`
      ==========Popularity Score SORT ${categoryType} 
      feedScore:${JSON.stringify(feedScore)}
      feedIds After Sort:${feedIds}
      `);
    }

    return feedIds;
  }

  _isGlobalMute(userId) {
    const oThis = this;

    if (oThis.mutedByAdminMap[userId]) {
      return (
        !oThis._hasContributedToUser(userId) && !oThis._isFollowingOnTwitter(userId) && !oThis._isCurrentUser(userId)
      );
    } else {
      return false;
    }
  }

  _isMutedByCurrentUser(userId) {
    const oThis = this;

    return oThis.muteByUserMap[userId];
  }

  _isBlocked(userId) {
    const oThis = this;

    return oThis.blockedUserInfo.hasBlocked[userId] || oThis.blockedUserInfo.blockedBy[userId];
  }

  _hasNewReplyByOtherUser(feedId) {
    const oThis = this;

    const feedObj = oThis.allFeedMap[feedId],
      videoId = feedObj.primaryExternalEntityId,
      lastReplyTimestampOnFeed = oThis._lastReplyTimestampOnFeed(feedObj);

    return (
      lastReplyTimestampOnFeed > 0 &&
      lastReplyTimestampOnFeed > oThis._videoLastSeenTimestamp(videoId) &&
      lastReplyTimestampOnFeed > oThis._lastReplyTimestampByCurrentUserOnVideo(videoId)
    );
  }

  _isUnseenVideo(videoId) {
    const oThis = this;

    return oThis._videoLastSeenTimestamp(videoId) <= 0;
  }

  _hasNotSeenMyLastReply(feedId) {
    const oThis = this;

    const feedObj = oThis.allFeedMap[feedId],
      videoId = feedObj.primaryExternalEntityId,
      myLastReplyTimestampOnFeed = oThis._lastReplyTimestampByCurrentUserOnVideo(videoId);
    return myLastReplyTimestampOnFeed > 0 && myLastReplyTimestampOnFeed > oThis._videoLastSeenTimestamp(videoId);
  }

  _videoLastSeenTimestamp(videoId) {
    const oThis = this;
    const userVideoViewObj = oThis.videoViewMap[videoId] || {};

    return Math.max(userVideoViewObj.lastViewAt || 0, userVideoViewObj.lastReplyViewAt || 0) / 1000;
  }

  _lastReplyTimestampByCurrentUserOnVideo(videoId) {
    const oThis = this;
    const videoRelatedActionsObj = oThis.userVideoActionMap[videoId] || {};

    return (videoRelatedActionsObj.lastReplyTimestamp || 0) / 1000;
  }

  _hasContributedToVideo(videoId) {
    const oThis = this;

    const videoRelatedActionsObj = oThis.userVideoActionMap[videoId] || {};

    return (videoRelatedActionsObj.lastVideoContributionTimestamp || 0) > 0;
  }

  _hasContributedToReplyOnVideo(videoId) {
    const oThis = this;

    const videoRelatedActionsObj = oThis.userVideoActionMap[videoId] || {};

    return (videoRelatedActionsObj.lastReplyContributionTimestamp || 0) > 0;
  }

  _hasContributedToUser(userId) {
    const oThis = this;

    const userRelatedActionObj = oThis.userUserActionMap[userId] || {};

    return userRelatedActionObj.userContributionTimestamp > 0;
  }

  _lastReplyTimestampOnFeed(feedObj) {
    return feedObj.lastReplyTimestamp || 0;
  }

  /**
   * Is popular
   *
   * @param feedObj
   * @return {*|number}
   * @private
   */
  _isPopular(feedObj) {
    return feedObj.isPopular || 0;
  }

  _isFollowingOnTwitter(userId) {
    const oThis = this;

    return oThis.twitterConnectionsMap[userId] == 1;
  }

  _isCurrentUser(userId) {
    const oThis = this;

    return Number(userId) === Number(oThis.currentUserId);
  }

  _isJoinedChannelVideo(videoId) {
    const oThis = this,
      videoDetail = oThis.videoDetailMap[videoId];

    for (let i = 0; i < videoDetail.channelIds.length; i++) {
      const cid = videoDetail.channelIds[i];

      if (oThis.joinedChannelIdMap[cid]) {
        return true;
      }
    }

    return false;
  }

  _isLoggingEnabled() {
    return !basicHelper.isProduction();
  }

  _videoScore(feedId) {
    const oThis = this;

    const feedObj = oThis.allFeedMap[feedId],
      videoId = feedObj.primaryExternalEntityId,
      videoDetail = oThis.videoDetailMap[videoId];

    //Note: paginationIdentifier is converted to decimal so that latest video is given priority if scores match.
    // To be sure paginationIdentifier is divided by extra 10's (if millisecond timestamp is used in future)
    const score =
      videoDetail.totalContributedBy + videoDetail.totalReplies + feedObj.paginationIdentifier / 10000000000000;

    return score;
  }
}

module.exports = Sort;
