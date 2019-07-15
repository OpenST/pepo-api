const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorContributedByPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorContributedByPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Contribution To(A list of users who were supported by current user)
 *
 * @class
 */
class UserContributionTo extends ContributionBase {
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

    const UserContributedToPaginationCacheObj = new UserContributorContributedByPaginationCache({
        limit: oThis.limit,
        page: oThis.page,
        contributedByUserId: oThis.currentUserId
      }),
      userPaginationCacheRes = await UserContributedToPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    oThis.contributionUserIds = userPaginationCacheRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = UserContributionTo;
