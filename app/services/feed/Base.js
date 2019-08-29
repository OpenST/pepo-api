const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed base.
 *
 * @class FeedBase
 */
class FeedBase extends ServiceBase {
  /**
   * Constructor for feed base.
   *
   * @param {object} params
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;

    oThis.feeds = [];
    oThis.feedsMap = {};
    oThis.feedIds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};
    oThis.tokenDetails = {};
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

    oThis._filterInactiveUserFeeds();

    await oThis._setTokenDetails();

    return oThis._prepareResponse();
  }

  /**
   * Get feed details.
   *
   * @sets oThis.feeds, oThis.userIds, oThis.videoIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getFeeds() {
    const oThis = this;

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const feedData = oThis.feedsMap[oThis.feedIds[index]];

      oThis.feeds.push(feedData);
      oThis.userIds.push(feedData.actor);

      if (feedData.kind === feedConstants.fanUpdateKind) {
        oThis.videoIds.push(feedData.primaryExternalEntityId);
      }
    }

    if (!CommonValidators.validateNonEmptyObject(oThis.feeds[0])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_f_b_1',
          api_error_identifier: 'resource_not_found',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Fetch profile details.
   *
   * @sets oThis.profileResponse
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    const getProfileObj = new GetProfile({
      userIds: oThis.userIds,
      currentUserId: oThis.currentUserId,
      videoIds: oThis.videoIds
    });

    const profileResp = await getProfileObj.perform();

    if (profileResp.isFailure()) {
      return Promise.reject(profileResp);
    }
    oThis.profileResponse = profileResp.data;

    return responseHelper.successWithData({});
  }

  /**
   * Filter out feeds of inactive users
   *
   * @private
   */
  _filterInactiveUserFeeds() {
    const oThis = this;

    for (let i = 0; i < oThis.feeds.length; i++) {
      const feedData = oThis.feeds[i];

      const profileObj = oThis.profileResponse.userProfilesMap[feedData.actor];

      // Delete feeds whose user profile is not found.
      if (!CommonValidators.validateNonEmptyObject(profileObj)) {
        oThis.feeds.splice(i, 1);
      }
    }
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @return {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const getTokenServiceObj = new GetTokenService({});

    const tokenResp = await getTokenServiceObj.perform();

    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }
    oThis.tokenDetails = tokenResp.data.tokenDetails;

    return responseHelper.successWithData({});
  }
}

module.exports = FeedBase;
