const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorContributedByPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorContributedByPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Contribution To (A list of users who were supported by current user).
 *
 * @class UserContributionTo
 */
class UserContributionTo extends ContributionBase {
  /**
   * Fetch user ids from cache.
   *
   * @sets oThis.contributionUserIds, oThis.contributionUsersByUserIdsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache() {
    const oThis = this;

    const UserContributedToPaginationCacheObj = new UserContributorContributedByPaginationCache({
        limit: oThis.limit,
        page: oThis.page,
        contributedByUserId: oThis.currentUserId
      }),
      userPaginationCacheRes = await UserContributedToPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    oThis.contributionUserIds = userPaginationCacheRes.data.userIds;
    oThis.contributionUsersByUserIdsMap = userPaginationCacheRes.data.contributionUsersByUserIdsMap;

    return responseHelper.successWithData({});
  }
}

module.exports = UserContributionTo;
