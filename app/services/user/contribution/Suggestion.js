const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  TwitterUserConnectionByUser1PaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/TwitterUserConnectionByUser1Pagination'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Suggestion(A list of users who should be suggested to the current user)
 *
 * @class
 */
class UserContributionSuggestion extends ContributionBase {
  /**
   * Constructor for user contribution base
   *
   * @param params
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;
  }

  /**
   * Fetch user Ids from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache() {
    const oThis = this;

    let TwitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();

    if (TwitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserByUserIdsCacheResp);
    }

    //should always be present;
    let currentUserTwitterUserId = TwitterUserByUserIdsCacheResp.data[oThis.currentUserId].id;

    const UserSuggestionPaginationCacheObj = new TwitterUserConnectionByUser1PaginationCache({
        limit: oThis.limit,
        page: oThis.page,
        twitterUser1Id: currentUserTwitterUserId
      }),
      userPaginationCacheRes = await UserSuggestionPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    let twitterUserIds = userPaginationCacheRes.data;

    if (twitterUserIds.length === 0) {
      return;
    }

    const TwitterUserByIdsCacheObj = new TwitterUserByIdsCache({
        ids: twitterUserIds
      }),
      TwitterUserByIdsCacheRes = await TwitterUserByIdsCacheObj.fetch();

    if (TwitterUserByIdsCacheRes.isFailure()) {
      return Promise.reject(TwitterUserByIdsCacheRes);
    }

    for (let twitterUserId in TwitterUserByIdsCacheRes.data) {
      let contributionUserId = TwitterUserByIdsCacheRes.data[twitterUserId].userId;
      oThis.contributionUserIds.push(contributionUserId);
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserContributionSuggestion;
