const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class FeedBase extends ServiceBase {
  /**
   * Constructor for feed base.
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUser = params.current_user;

    oThis.feeds = [];
    oThis.feedsMap = {};
    oThis.feedIds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};
  }

  /**
   * Async perform for feed base.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setFeedIds();

    await oThis._getFeeds();

    await oThis._fetchProfileDetails();

    return oThis._prepareResponse();
  }

  /**
   * Get Feed details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getFeeds() {
    const oThis = this;

    for (let i = 0; i < oThis.feedIds.length; i++) {
      let feedData = oThis.feedsMap[oThis.feedIds[i]];

      oThis.feeds.push(feedData);
      oThis.userIds.push(feedData.actor);

      if (feedData.kind === feedConstants.fanUpdateKind) {
        oThis.videoIds.push(feedData.primaryExternalEntityId);
      }
    }

    if (oThis.feeds.length === 0) {
      return responseHelper.error({
        internal_error_identifier: 'a_s_f_b_1',
        api_error_identifier: 'resource_not_found',
        debug_options: {
          feedsArray: oThis.feeds,
          userIds: oThis.userIds
        }
      });
    }
  }

  /**
   * Fetch profile details.
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

module.exports = FeedBase;
