const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PublicVideoFeed extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.feeds = [];
    oThis.feedIds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setFeedIds();

    await oThis._getFeeds();

    return oThis._prepareResponse();
  }

  /**
   * Get Feed details
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getFeeds() {
    const oThis = this;

    const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();

    if (feedByIdsCacheResponse.isFailure()) {
      return Promise.reject(feedByIdsCacheResponse);
    }

    const feedsData = feedByIdsCacheResponse.data;

    for(let feedId in feedsData) {
      let feedData = feedsData[feedId];
      oThis.feeds.push(feedData);
      oThis.userIds.push(feedData.actor);
      if(feedData.) {
      
      }
      oThis.videoIds.push(feedData.primaryExternalEntityId);
    }
    
    oThis.userIds = [1000, 1001, 1002];
    oThis.videoIds = [123, 124, 125];
  }

  /**
   * Fetch profile details
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    let getProfileObj = new GetProfile({
      userIds: oThis.userIds,
      currentUserId: oThis.currentUserId,
      videoIds: oThis.videoIds
    });

    let profileResp = await getProfileObj.perform();

    if (profileResp.isFailure()) {
      return Promise.reject(profileResp);
    }
    oThis.profileResponse = profileResp.data;

    return responseHelper.successWithData({});
  }
}

module.exports = PublicVideoFeed;
