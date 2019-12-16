const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  headerHelper = require(rootPrefix + '/helpers/header'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
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
   * @param {object} params.headers
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

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
    oThis.headers = params.headers;

    oThis.isReplyBuild = false;
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let sortFeed = false;

    if (headerHelper.isReplyBuild(oThis.headers)) {
      oThis.isReplyBuild = true;
      sortFeed = true;
    } else if (headerHelper.isVideoPlayEventBuild(oThis.headers)) {
      sortFeed = true;
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
   * Main method for old devices without video play event.
   *
   * @returns {Promise<void>}
   */
  async _performSort() {
    const oThis = this;

    let lastPaginationTimestamp = null;

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
      shuffleList: [],
      othersList: []
    };

    for (let i = 0; i < oThis.allFeedIds.length; i++) {
      const feedId = oThis.allFeedIds[i],
        feedObj = oThis.allFeedMap[feedId],
        videoId = feedObj.primaryExternalEntityId,
        actorId = feedObj.actor;

      const isUnseenVideo = oThis._isUnseenVideo(videoId),
        isMyVideo = oThis._isCurrentUser(actorId),
        isPopularFeed = oThis._isPopular(feedObj),
        iHaveReplied = oThis._lastReplyTimestampByCurrentUserOnVideo(videoId) > 0,
        hasContributedToAuthor = oThis._hasContributedToUser(actorId),
        hasNotSeenMyLastReply = oThis._hasNotSeenMyLastReply(feedId);

      let hasNewReplyByOtherUsers = false;

      // If user doesn't have reply build, then no need to republish videos by replies.
      if (oThis.isReplyBuild) {
        hasNewReplyByOtherUsers = oThis._hasNewReplyByOtherUser(feedId);
      }

      lastPaginationTimestamp = feedObj.paginationIdentifier;

      if (oThis._isLoggingEnabled()) {
        logger.info(`\n------------FEED DATA FOR FEED ID: ${feedId} ---oThis.currentUserId:${
          oThis.currentUserId
        }-----------
      isMyVideo:${isMyVideo}
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
        //   todo feed what about replies on my video??
      } else if (iHaveReplied && hasNotSeenMyLastReply) {
        // Is my reply to any video.
        sortData.category2.push(feedId);
      } else if (iHaveReplied && hasNewReplyByOtherUsers) {
        // I had replied to a video and has a new reply. (Republish on top)
        sortData.category3.push(feedId);
      } else if (isUnseenVideo && hasContributedToAuthor) {
        // Unseen video from author's I have contributed to.
        sortData.category4.push(feedId);
      } else if (oThis._hasContributedToVideo(videoId) && hasNewReplyByOtherUsers) {
        // Video Contributor and has a new reply. (Republish on top)
        sortData.category5.push(feedId);
      } else if (oThis._hasContributedToReplyOnVideo(videoId) && hasNewReplyByOtherUsers) {
        // Reply Contributor and has a new reply. (Republish on top)
        sortData.category6.push(feedId);
      } else if (hasContributedToAuthor && hasNewReplyByOtherUsers) {
        // Video from Author's i have Contributed to and has a new reply. (Republish on top)
        sortData.category7.push(feedId);
      } else if (isUnseenVideo && oThis._isFollowingOnTwitter(actorId)) {
        // Unseen videos from people I follow on Twitter.
        sortData.category8.push(feedId);
      } else if (isUnseenVideo && isPopularFeed) {
        // Unseen videos which are popular.
        sortData.category9.push(feedId);
      } else if (isUnseenVideo) {
        // Unseen videos.
        sortData.category10.push(feedId);
      } else if (isPopularFeed && hasNewReplyByOtherUsers) {
        // Popular video.
        // It should already be seen as the above condition in if is present.
        sortData.category11.push(feedId);
      } else {
        // It should already be seen as the above condition in if is present.
        const lastShuffleTime = Date.now() / 1000 - feedConstants.personalizedFeedSeenVideosAgeInSeconds;

        if (lastShuffleTime <= feedObj.paginationIdentifier) {
          // Shuffle recent published video.
          sortData.shuffleList.push(feedId);
        } else {
          sortData.othersList.push(feedId);
        }
      }
    }

    if (oThis._isLoggingEnabled()) {
      logger.info(`\n================sortData:${JSON.stringify(sortData)} ------------\n`);
    }

    sortData.shuffleList = basicHelper.shuffleArray(sortData.shuffleList);

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
      sortData.shuffleList,
      sortData.othersList
    );

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

    return oThis.twitterConnectionsMap[userId];
  }

  _isCurrentUser(userId) {
    const oThis = this;

    return Number(userId) === Number(oThis.currentUserId);
  }

  _isLoggingEnabled() {
    return basicHelper.isStaging();
  }
}

module.exports = Sort;
