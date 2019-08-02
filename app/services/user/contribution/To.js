const BigNumber = require('bignumber.js');

const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorContributedByPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorContributedByPagination'),
  PendingTransactionsByToUserIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByToUserIdsAndFromUserId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user contribution to (A list of users who were supported by current user).
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
        contributedByUserId: oThis.profileUserId
      }),
      userPaginationCacheRes = await UserContributedToPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    oThis.contributionUserIds = userPaginationCacheRes.data.userIds;
    oThis.contributionUsersByUserIdsMap = userPaginationCacheRes.data.contributionUsersByUserIdsMap;

    if (oThis.isProfileUserCurrentUser) {
      await oThis._fetchPendingTransactionsForProfileUser();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch pending transactions for profile user if profileUserId is same as currentUserId.
   *
   * @sets oThis.contributionUsersByUserIdsMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchPendingTransactionsForProfileUser() {
    const oThis = this;

    const cacheResponse = await new PendingTransactionsByToUserIdsAndFromUserIdCache({
      fromUserId: oThis.profileUserId,
      toUserIds: oThis.contributionUserIds
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const pendingTransactionData = cacheResponse.data;

    for (const userId in pendingTransactionData) {
      const userRows = pendingTransactionData[userId];

      let userContributionAmount = new BigNumber(oThis.contributionUsersByUserIdsMap[userId].totalAmount);

      for (let index = 0; index < userRows.length; index++) {
        userContributionAmount = userContributionAmount.plus(new BigNumber(userRows[index].amount));
      }

      oThis.contributionUsersByUserIdsMap[userId].totalAmount = userContributionAmount.toString();
    }

    return responseHelper.successWithData({});
  }
}

module.exports = UserContributionTo;
