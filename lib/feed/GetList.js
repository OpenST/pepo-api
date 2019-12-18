const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  LatestFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LatestFeed'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  TwitterUserConnectionByTwitterUser2IdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/TwitterUserConnectionByTwitterUser2Ids'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  UserActionDetailsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserActionDetailsByUserIds'),
  SortFeedLib = require(rootPrefix + '/lib/feed/Sort'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userActionDetailConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userActionDetail');

/**
 * Class for SortUnseenFeed.
 *
 * @class SortUnseenFeed
 */
class SortUnseenFeed {
  /**
   * Constructor for sort unseen feed.
   *
   * @param {number} params.currentUserId
   * @param {Boolean} params.headers
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.currentUserId = params.currentUserId;
    oThis.headers = params.headers;

    oThis.blockedUserInfo = {};
    oThis.muteByUserMap = {};
    oThis.mutedByAdminMap = {};
    oThis.allFeedMap = {};
    oThis.allFeedIds = [];
    oThis.allUserIds = [];
    oThis.allVideoIds = [];
    oThis.twitterConnectionsMap = {};
    oThis.videoViewMap = {};
    oThis.userVideoActionMap = {};
    oThis.userUserActionMap = {};
    oThis.videoDetailMap = {};
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promise1 = [];
    promise1.push(oThis._getFeedDataAndOtherEntities());
    if (oThis.currentUserId) {
      promise1.push(oThis._setBlockedUsersList());
      promise1.push(oThis._setMuteByUserList());
    }

    await Promise.all(promise1);

    const promise2 = [];
    if (oThis.currentUserId) {
      promise2.push(oThis._getCurrentUserTwitterUserConnections());
      promise2.push(oThis._getUserVideoViewData());
      promise2.push(oThis._getUserActionData());
    }

    promise2.push(oThis._setMuteByAdminList());
    promise2.push(oThis._getVideoDetails());

    await Promise.all(promise2);

    return oThis._sortFeeds();
  }

  /**
   * Get sorted feed ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sortFeeds() {
    const oThis = this;

    const sortParams = {
      currentUserId: oThis.currentUserId,
      blockedUserInfo: oThis.blockedUserInfo,
      muteByUserMap: oThis.muteByUserMap,
      mutedByAdminMap: oThis.mutedByAdminMap,
      allFeedMap: oThis.allFeedMap,
      allFeedIds: oThis.allFeedIds,
      allUserIds: oThis.allUserIds,
      allVideoIds: oThis.allVideoIds,
      twitterConnectionsMap: oThis.twitterConnectionsMap,
      videoViewMap: oThis.videoViewMap,
      userVideoActionMap: oThis.userVideoActionMap,
      userUserActionMap: oThis.userUserActionMap,
      videoDetailMap: oThis.videoDetailMap,
      headers: oThis.headers
    };

    return new SortFeedLib(sortParams).perform();
  }

  /**
   * Get feed data from feeds table.
   *
   * Sets oThis.allFeedIds, oThis.allFeedMap, oThis.allUserIds, oThis.allVideoIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getFeedDataAndOtherEntities() {
    const oThis = this;

    const latestFeedCacheResp = await new LatestFeedCache().fetch();

    if (latestFeedCacheResp.isFailure()) {
      return Promise.reject(latestFeedCacheResp);
    }

    const latestFeedCacheRespData = latestFeedCacheResp.data;

    oThis.allFeedIds = latestFeedCacheRespData.feedIds;
    oThis.allFeedMap = latestFeedCacheRespData.feedsMap;

    for (const feedId in oThis.allFeedMap) {
      const feedObj = oThis.allFeedMap[feedId];
      oThis.allUserIds.push(feedObj.actor);
      oThis.allVideoIds.push(feedObj.primaryExternalEntityId);
    }

    if (oThis.currentUserId) {
      // Push current user in the list.
      oThis.allUserIds.push(oThis.currentUserId);
    }

    // Push current user in the list after getting mute list.
    oThis.allUserIds = [...new Set(oThis.allUserIds)];
  }

  /**
   * Get blocked users list.
   *
   * Sets oThis.blockedUserInfo
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setBlockedUsersList() {
    const oThis = this;

    const cacheResp = await new UserBlockedListCache({ userId: oThis.currentUserId }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.blockedUserInfo = cacheResp.data[oThis.currentUserId];
  }

  /**
   * Get muted users list.
   *
   * Sets oThis.muteByUserMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setMuteByUserList() {
    const oThis = this;

    const mutedUsersCacheRsp = await new UserMuteByUser1IdsCache({ user1Ids: [oThis.currentUserId] }).fetch();

    if (mutedUsersCacheRsp.isFailure()) {
      return Promise.reject(mutedUsersCacheRsp);
    }

    oThis.muteByUserMap = mutedUsersCacheRsp.data[oThis.currentUserId];
  }

  /**
   * Get muted by admin users list.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _setMuteByAdminList() {
    const oThis = this;

    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: oThis.allUserIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const globalUserMuteDetailsByUserIdMap = cacheResponse.data;

    for (let userId in globalUserMuteDetailsByUserIdMap) {
      let obj = globalUserMuteDetailsByUserIdMap[userId];
      if (obj.all) {
        // All Keys are string as it is bigint
        oThis.mutedByAdminMap[userId] = 1;
      }
    }

    if (oThis.currentUserId) {
      // Current user should not be muted for himself.
      delete oThis.mutedByAdminMap[oThis.currentUserId];
    }
  }

  /**
   * Get current user twitter user connections.
   *
   * Sets oThis.twitterConnectionsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getCurrentUserTwitterUserConnections() {
    const oThis = this;

    let twitterUser2Ids = [];
    let twitterUserIdToUserIdMap = {};

    // Get twitter user ids for actor ids and current user id.
    const twitterUserCacheResp = await new TwitterUserByUserIdsCache({ userIds: oThis.allUserIds }).fetch();

    if (twitterUserCacheResp.isFailure()) {
      return Promise.reject(twitterUserCacheResp);
    }

    const twitterUserCacheRespData = twitterUserCacheResp.data;

    for (let index = 0; index < oThis.allUserIds.length; index++) {
      const userId = oThis.allUserIds[index];
      twitterUser2Ids.push(twitterUserCacheRespData[userId].id);
      twitterUserIdToUserIdMap[twitterUserCacheRespData[userId].id] = userId;
    }

    const twitterUser1Id = twitterUserCacheRespData[oThis.currentUserId].id;

    const TwitterUserConnectionByTwitterUser2IdsCacheResp = await new TwitterUserConnectionByTwitterUser2IdsCache({
      twitterUser1Id: twitterUser1Id,
      twitterUser2Ids: twitterUser2Ids
    }).fetch();

    if (TwitterUserConnectionByTwitterUser2IdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserConnectionByTwitterUser2IdsCacheResp);
    }

    const TwitterUserConnectionByTwitterUser2IdsCacheRespData = TwitterUserConnectionByTwitterUser2IdsCacheResp.data;

    for (let index = 0; index < twitterUser2Ids.length; index++) {
      const twitterUser2Id = twitterUser2Ids[index],
        twitterUserConnectionObj = TwitterUserConnectionByTwitterUser2IdsCacheRespData[twitterUser2Id],
        userId = twitterUserIdToUserIdMap[twitterUser2Id];

      if (CommonValidators.validateNonEmptyObject(twitterUserConnectionObj)) {
        oThis.twitterConnectionsMap[userId] = 1;
      } else {
        oThis.twitterConnectionsMap[userId] = 0;
      }
    }
  }

  /**
   * Get user video details data.
   *
   * Sets oThis.videoDetailMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getVideoDetails() {
    const oThis = this;

    if (oThis.allVideoIds.length > 0) {
      const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: oThis.allVideoIds }).fetch();

      if (videoDetailsCacheResponse.isFailure()) {
        logger.error('Error while fetching video detail data.');
        return Promise.reject(videoDetailsCacheResponse);
      }

      oThis.videoDetailMap = videoDetailsCacheResponse.data;
    }
  }

  /**
   * Get user video view data.
   *
   * Sets oThis.videoViewMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserVideoViewData() {
    const oThis = this;

    if (oThis.allVideoIds.length > 0) {
      oThis.videoViewMap = await new UserVideoViewModel().fetchVideoViewDetails({
        userId: oThis.currentUserId,
        videoIds: oThis.allVideoIds
      });
    }
  }

  /**
   * Get user action data.
   *
   * Sets oThis.userVideoActionMap, oThis.userUserActionMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserActionData() {
    const oThis = this;

    let entityIdentifiers = [];
    for (let i = 0; i < oThis.allUserIds.length; i++) {
      let entityIdentifier = userActionDetailConstants.createEntityIdentifier(
        userActionDetailConstants.userEntityKind,
        oThis.allUserIds[i]
      );
      entityIdentifiers.push(entityIdentifier);
    }

    for (let i = 0; i < oThis.allVideoIds.length; i++) {
      let entityIdentifier = userActionDetailConstants.createEntityIdentifier(
        userActionDetailConstants.videoEntityKind,
        oThis.allVideoIds[i]
      );
      entityIdentifiers.push(entityIdentifier);
    }

    if (entityIdentifiers.length > 0) {
      const userActionDetailsCacheResp = await new UserActionDetailsByUserIdsCache({
        entityIdentifiers: entityIdentifiers,
        userId: oThis.currentUserId
      }).fetch();

      if (userActionDetailsCacheResp.isFailure()) {
        return Promise.reject(userActionDetailsCacheResp);
      }

      for (let entityIdentifer in userActionDetailsCacheResp.data) {
        const dbRow = userActionDetailsCacheResp.data[entityIdentifer];
        if (CommonValidators.validateNonEmptyObject(dbRow)) {
          if (dbRow.entityKind == userActionDetailConstants.videoEntityKind) {
            oThis.userVideoActionMap[dbRow.entityId] = dbRow;
          } else if (dbRow.entityKind == userActionDetailConstants.userEntityKind) {
            oThis.userUserActionMap[dbRow.entityId] = dbRow;
          } else {
            throw new Error(`Invalid entityKind for user action detail-${JSON.stringify(dbRow)}`);
          }
        }
      }
    }
  }
}

module.exports = SortUnseenFeed;
