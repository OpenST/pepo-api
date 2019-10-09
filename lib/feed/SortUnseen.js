const rootPrefix = '../..',
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserConnectionByTwitterUser2IdsCache = require(rootPrefix +
    'lib/cacheManagement/multi/TwitterUserConnectionByTwitterUser2Ids'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
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
   * @param {array} params.unseenFeedIds
   * @param {object} params.feedsMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    oThis.currentUserId = params.currentUserId;
    oThis.unseenFeedIds = params.unseenFeedIds;
    oThis.feedsMap = params.feedsMap;

    oThis.actorIds = [];
    oThis.twitterUser2Ids = [];
    oThis.actorIdToFeedIdsMap = {};
    oThis.twitterUserIdToUserIdMap = {};
  }

  async asyncPerform() {
    const oThis = this;

    await oThis._fetchActorIds();

    return oThis._getCurrentUserTwitterUserConnections();
  }

  /**
   * Fetch actor ids for current user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchActorIds() {
    const oThis = this;

    for (let index = 0; index < oThis.unseenFeedIds.length; index++) {
      const unseenFeedId = oThis.unseenFeedIds[index];

      if (!basicHelper.isEmptyObject(oThis.feedsMap[unseenFeedId])) {
        oThis.actorIds.push(oThis.feedsMap[unseenFeedId].actor);

        oThis.actorIdToFeedIdsMap[oThis.actor] = oThis.actorIdToFeedIdsMap[oThis.actor] || [];
        oThis.actorIdToFeedIdsMap[oThis.actor].push(unseenFeedId);
      }
    }

    // Get unique actor ids.
    oThis.actorIds = [...new Set(oThis.actorIds)];
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

    oThis.actorIds.push(oThis.currentUserId);

    // Get twitter user ids for actor ids and current user id.
    const twitterUserCacheResp = await new TwitterUserByUserIdsCache({ userIds: oThis.actorIds }).fetch();

    if (twitterUserCacheResp.isFailure()) {
      return Promise.reject(twitterUserCacheResp);
    }

    const twitterUserCacheRespData = twitterUserCacheResp.data;

    for (let index = 0; index < oThis.actorIds.length; index++) {
      const userId = oThis.actorIds[index];
      twitterUser2Ids.push(twitterUserCacheRespData[userId].id);

      oThis.twitterUserIdToUserIdMap[twitterUserCacheRespData[userId].id] = userId;
    }

    const twitterUser1Id = twitterUserCacheRespData[oThis.currentUserId].id;

    const TwitterUserConnectionByTwitterUser2IdsCacheResp = await new TwitterUserConnectionByTwitterUser2IdsCache({
      twitterUser1Id: twitterUser1Id,
      twitterUser2Ids: twitterUser2Ids
    }).fetch();

    if (TwitterUserConnectionByTwitterUser2IdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserConnectionByTwitterUser2IdsCacheResp);
    }

    let TwitterUserConnectionByTwitterUser2IdsCacheRespData = TwitterUserConnectionByTwitterUser2IdsCacheResp.data,
      relevantFeedIds = [],
      irrelevantFeedIds = [];

    for (let index = 0; index < twitterUser2Ids.length; index++) {
      const twitterUser2Id = twitterUser2Ids[index],
        twitterUserConnectionObj = TwitterUserConnectionByTwitterUser2IdsCacheRespData[twitterUser2Id],
        userId = oThis.twitterUserIdToUserIdMap[twitterUser2Id],
        feedIdsForUserId = oThis.actorIdToFeedIdsMap[userId];

      if (!basicHelper.isEmptyObject(twitterUserConnectionObj)) {
        if (
          TwitterUserConnectionModel.isRegisteredTwitterConnection(twitterUserConnectionObj) ||
          TwitterUserConnectionModel.isContributedTwitterConnection(twitterUserConnectionObj)
        ) {
          relevantFeedIds.concat(feedIdsForUserId);
        } else {
          irrelevantFeedIds.concat(feedIdsForUserId);
        }
      }
    }

    const unseenFeedIds = relevantFeedIds.concat(irrelevantFeedIds);

    return responseHelper.successWithData({
      unseenFeedIds: unseenFeedIds
    });
  }
}

module.exports = SortUnseenFeed;
