const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Contribution By(A list of users who supported the current user)
 *
 * @class UserContributionBy
 */
class UserContributionBy extends ContributionBase {
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

    const UserContributedByPaginationCacheObj = new UserContributorByUserIdPaginationCache({
        limit: oThis.limit,
        page: oThis.page,
        userId: oThis.currentUserId
      }),
      userPaginationCacheRes = await UserContributedByPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    oThis.contributionUserIds = userPaginationCacheRes.data;

    return responseHelper.successWithData({});
  }
}

module.exports = UserContributionBy;
