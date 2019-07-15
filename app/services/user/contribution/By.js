const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Contribution By(A list of users who supported the current user)
 *
 * @class
 */
class UserContributionBy extends ContributionBase {
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

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserContributionBy;
