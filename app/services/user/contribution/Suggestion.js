const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserConnectionByUser1PaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/TwitterUserConnectionByUser1Pagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user suggestion (A list of users who should be suggested to the current user).
 *
 * @class UserContributionSuggestion
 */
class UserContributionSuggestion extends ContributionBase {
  /**
   * Constructor for user suggestion (A list of users who should be suggested to the current user).
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.current_user.id
   * @param {number/string} params.profile_user_id
   * @param {string} [params.pagination_identifier]
   *
   * @augments ContributionBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.isProfileUserCurrentUser = false;
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.isProfileUserCurrentUser
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.isProfileUserCurrentUser = oThis.profileUserId === oThis.currentUserId;

    if (!oThis.isProfileUserCurrentUser) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_c_s_1',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            reason: 'Invalid userId',
            profileUserId: oThis.profileUserId,
            currentUserId: oThis.currentUserId
          }
        })
      );
    }

    return super._validateAndSanitizeParams();
  }

  /**
   * Fetch user ids from cache.
   *
   * @sets oThis.contributionUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache() {
    const oThis = this;

    const twitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.profileUserId]
    }).fetch();

    if (twitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResp);
    }

    // Should always be present.
    const currentUserTwitterUserId = twitterUserByUserIdsCacheResp.data[oThis.profileUserId].id;

    const userPaginationCacheRes = await new TwitterUserConnectionByUser1PaginationCache({
      limit: oThis.limit,
      page: oThis.page,
      twitterUser1Id: currentUserTwitterUserId
    }).fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    const twitterUserIds = userPaginationCacheRes.data;

    if (twitterUserIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const twitterUserByIdsCacheRes = await new TwitterUserByIdsCache({
      ids: twitterUserIds
    }).fetch();

    if (twitterUserByIdsCacheRes.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheRes);
    }

    for (const twitterUserId in twitterUserByIdsCacheRes.data) {
      const contributionUserId = twitterUserByIdsCacheRes.data[twitterUserId].userId;
      oThis.contributionUserIds.push(contributionUserId);
    }

    return responseHelper.successWithData({});
  }
}

module.exports = UserContributionSuggestion;
