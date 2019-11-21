const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  TwitterUserConnectionByTwitterUser2IdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/TwitterUserConnectionByTwitterUser2Ids'),
  UserContributorMultiCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   * @param {array} params.allActorIds
   * @param {array} params.unseenFeedIds
   * @param {array} params.seenFeedIds
   * @param {array} params.shuffledSeenFeedIds
   * @param {array} params.sortFeeds
   * @param {object} params.feedsMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.actorIds = params.allActorIds;
    oThis.currentUserId = params.currentUserId;
    oThis.unseenFeedIds = params.unseenFeedIds;
    oThis.seenFeedIds = params.seenFeedIds;
    oThis.shuffledSeenFeedIds = params.shuffledSeenFeedIds;
    oThis.sortFeeds = params.sortFeeds;
    oThis.feedsMap = params.feedsMap;

    oThis.userContributorMap = {};
    oThis.mutedActorIds = {};
    oThis.twitterUserConnectionMap = {};

    oThis.actorIds.push(oThis.currentUserId);
    oThis.actorIds = [...new Set(oThis.actorIds)];
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchMutedActorIds();

    let promises = [];
    promises.push(oThis._getUserContributors());
    promises.push(oThis._getCurrentUserTwitterUserConnections());
    await Promise.all(promises);

    return oThis._sortFeedIds();
  }

  /**
   * Fetch muted actor ids for current user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchMutedActorIds() {
    const oThis = this;

    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: oThis.actorIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const globalUserMuteDetailsByUserIdMap = cacheResponse.data;

    for (let userId in globalUserMuteDetailsByUserIdMap) {
      let obj = globalUserMuteDetailsByUserIdMap[userId];
      if (obj.all) {
        //All Keys are string as it is bigint
        oThis.mutedActorIds[userId] = 1;
      }
    }
  }

  /**
   * Get user contributors.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserContributors() {
    const oThis = this,
      userContributorMultiCacheResp = await new UserContributorMultiCache({
        contributedByUserId: oThis.currentUserId,
        userIds: oThis.actorIds
      }).fetch();

    if (userContributorMultiCacheResp.isFailure()) {
      return Promise.reject(userContributorMultiCacheResp);
    }

    oThis.userContributorMap = userContributorMultiCacheResp.data;
  }

  /**
   * Get current user twitter user connections.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getCurrentUserTwitterUserConnections() {
    const oThis = this;

    let twitterUser2Ids = [];
    let twitterUserIdToUserIdMap = {};

    // Get twitter user ids for actor ids and current user id.
    const twitterUserCacheResp = await new TwitterUserByUserIdsCache({ userIds: oThis.actorIds }).fetch();

    if (twitterUserCacheResp.isFailure()) {
      return Promise.reject(twitterUserCacheResp);
    }

    const twitterUserCacheRespData = twitterUserCacheResp.data;

    for (let index = 0; index < oThis.actorIds.length; index++) {
      const userId = oThis.actorIds[index];
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
        twitterUserConnectionObj = TwitterUserConnectionByTwitterUser2IdsCacheRespData[twitterUser2Id];

      if (CommonValidators.validateNonEmptyObject(twitterUserConnectionObj)) {
        const userId = twitterUserIdToUserIdMap[twitterUser2Id];
        oThis.twitterUserConnectionMap[String(userId)] = twitterUserConnectionObj;
      }
    }
  }

  /**
   * Sort feed ids.
   *
   * @private
   */
  _sortFeedIds() {
    const oThis = this;

    let relevantFeedIds = [],
      currentUserFeedIds = [],
      irrelevantFeedIds = [];

    for (let index = 0; index < oThis.unseenFeedIds.length; index++) {
      const unseenFeedId = oThis.unseenFeedIds[index],
        feedObj = oThis.feedsMap[unseenFeedId];

      if (CommonValidators.validateNonEmptyObject(feedObj)) {
        const userId = String(feedObj.actor),
          userContributorObj = oThis.userContributorMap[userId],
          twitterUserConnectionObj = oThis.twitterUserConnectionMap[userId];

        if (oThis.sortFeeds) {
          if (Number(userId) === Number(oThis.currentUserId)) {
            currentUserFeedIds.push(unseenFeedId);
          } else if (
            CommonValidators.validateNonEmptyObject(userContributorObj) ||
            CommonValidators.validateNonEmptyObject(twitterUserConnectionObj)
          ) {
            relevantFeedIds.push(unseenFeedId);
          } else {
            if (!oThis.mutedActorIds[userId]) {
              irrelevantFeedIds.push(unseenFeedId);
            }
          }
        } else {
          if (
            !oThis.mutedActorIds[userId] ||
            Number(userId) === Number(oThis.currentUserId) ||
            (CommonValidators.validateNonEmptyObject(userContributorObj) ||
              CommonValidators.validateNonEmptyObject(twitterUserConnectionObj))
          ) {
            irrelevantFeedIds.push(unseenFeedId);
          }
        }
      }
    }

    const seenFeedIds = [];
    for (let index = 0; index < oThis.seenFeedIds.length; index++) {
      const seenFeedId = oThis.seenFeedIds[index],
        feedObj = oThis.feedsMap[seenFeedId];

      if (CommonValidators.validateNonEmptyObject(feedObj)) {
        const userId = String(feedObj.actor),
          userContributorObj = oThis.userContributorMap[userId],
          twitterUserConnectionObj = oThis.twitterUserConnectionMap[userId];

        if (
          oThis.mutedActorIds[userId] == -1 ||
          Number(userId) === Number(oThis.currentUserId) ||
          (CommonValidators.validateNonEmptyObject(userContributorObj) ||
            CommonValidators.validateNonEmptyObject(twitterUserConnectionObj))
        ) {
          seenFeedIds.push(seenFeedId);
        }
      }
    }

    const shuffledSeenFeedIds = [];
    for (let index = 0; index < oThis.shuffledSeenFeedIds.length; index++) {
      const shuffledSeenFeedId = oThis.shuffledSeenFeedIds[index],
        feedObj = oThis.feedsMap[shuffledSeenFeedId];

      if (CommonValidators.validateNonEmptyObject(feedObj)) {
        const userId = String(feedObj.actor),
          userContributorObj = oThis.userContributorMap[userId],
          twitterUserConnectionObj = oThis.twitterUserConnectionMap[userId];

        if (
          oThis.mutedActorIds[userId] == -1 ||
          Number(userId) === Number(oThis.currentUserId) ||
          (CommonValidators.validateNonEmptyObject(userContributorObj) ||
            CommonValidators.validateNonEmptyObject(twitterUserConnectionObj))
        ) {
          shuffledSeenFeedIds.push(shuffledSeenFeedId);
        }
      }
    }

    let sortedFeedIds = currentUserFeedIds.concat(relevantFeedIds);
    sortedFeedIds = sortedFeedIds.concat(irrelevantFeedIds);

    return responseHelper.successWithData({
      unseenFeedIds: sortedFeedIds,
      seenFeedIds: seenFeedIds,
      shuffledSeenFeedIds: shuffledSeenFeedIds
    });
  }
}

module.exports = SortUnseenFeed;
