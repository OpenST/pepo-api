const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
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
   * @param {array} params.unseenFeedIds
   * @param {object} params.feedsMap
   * @param {Boolean} params.isOlderBuildWithoutVideoPlayEvent
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    oThis.currentUserId = params.currentUserId;
    oThis.unseenFeedIds = params.unseenFeedIds;
    oThis.feedsMap = params.feedsMap;
    oThis.isOlderBuildWithoutVideoPlayEvent = params.isOlderBuildWithoutVideoPlayEvent;

    oThis.actorIds = [];
    oThis.userContributorMap = {};
    oThis.twitterUserConnectionMap = {};
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchActorIds();

    let promises = [];
    promises.push(oThis._getUserContributors());
    promises.push(oThis._getCurrentUserTwitterUserConnections());
    await Promise.all(promises);

    return oThis._sortFeedIds();
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

      if (CommonValidators.validateNonEmptyObject(oThis.feedsMap[unseenFeedId])) {
        oThis.actorIds.push(oThis.feedsMap[unseenFeedId].actor);
      }
    }

    oThis.actorIds.push(oThis.currentUserId);
    // Get unique actor ids.
    oThis.actorIds = [...new Set(oThis.actorIds)];
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
        oThis.twitterUserConnectionMap[userId] = twitterUserConnectionObj;
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
      irrelevantFeedIds = [];

    for (let index = 0; index < oThis.unseenFeedIds.length; index++) {
      const unseenFeedId = oThis.unseenFeedIds[index],
        feedObj = oThis.feedsMap[unseenFeedId];

      if (CommonValidators.validateNonEmptyObject(feedObj)) {
        const userId = feedObj.actor,
          userContributorObj = oThis.userContributorMap[userId],
          twitterUserConnectionObj = oThis.twitterUserConnectionMap[userId];

        if (
          oThis.isOlderBuildWithoutVideoPlayEvent ||
          Number(userId) === Number(oThis.currentUserId) ||
          CommonValidators.validateNonEmptyObject(userContributorObj) ||
          CommonValidators.validateNonEmptyObject(twitterUserConnectionObj)
        ) {
          relevantFeedIds.push(unseenFeedId);
        } else {
          irrelevantFeedIds.push(unseenFeedId);
        }
      }
    }

    const sortedFeedIds = relevantFeedIds.concat(irrelevantFeedIds);

    return responseHelper.successWithData({
      unseenFeedIds: sortedFeedIds
    });
  }
}

module.exports = SortUnseenFeed;
