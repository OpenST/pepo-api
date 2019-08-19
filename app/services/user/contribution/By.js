const BigNumber = require('bignumber.js');

const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  PendingTransactionsByToUserIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByToUserIdsAndFromUserId'),
  UserContributorByUIdsAndCBUIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user contribution by (A list of users who support the current user).
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
        userId: oThis.profileUserId
      }),
      userPaginationCacheRes = await UserContributedByPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    oThis.contributionUserIds = userPaginationCacheRes.data.contributedByUserIds;
    oThis.contributionUsersByUserIdsMap = userPaginationCacheRes.data.contributionUsersByUserIdsMap;

    await oThis._fetchPendingTransactionsForCurrentUser();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch pending transactions for current user if currentUserId is a contributor for profileUserId.
   *
   * @sets oThis.contributionUsersByUserIdsMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchPendingTransactionsForCurrentUser() {
    const oThis = this;

    if (
      oThis.currentUserId == oThis.profileUserId ||
      (oThis.page > 1 && !oThis.contributionUsersByUserIdsMap[oThis.currentUserId])
    ) {
      return responseHelper.successWithData({});
    }

    const cacheResponse = await new PendingTransactionsByToUserIdsAndFromUserIdCache({
      fromUserId: oThis.currentUserId,
      toUserIds: [oThis.profileUserId]
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const pendingTransactionData = cacheResponse.data;

    const userRows = pendingTransactionData[oThis.profileUserId];
    // There should only be one entity for the contribution to profileUserId by currentUserId

    if (userRows.length == 0) {
      return responseHelper.successWithData({});
    }

    if (!oThis.contributionUsersByUserIdsMap[oThis.currentUserId] && oThis.page == 1) {
      // Note:Check if current user is not a contributor. Only then he should be added in the first page list

      let cacheResp = await new UserContributorByUIdsAndCBUIdCache({
        userIds: [oThis.profileUserId],
        contributedByUserId: oThis.currentUserId
      }).fetch();

      if (cacheResp.isFailure()) {
        return Promise.reject(cacheResp);
      }

      if (!basicHelper.isEmptyObject(cacheResp.data[oThis.profileUserId])) {
        return responseHelper.successWithData({});
      }

      oThis.contributionUsersByUserIdsMap[oThis.currentUserId] = {
        contributedByUserId: oThis.currentUserId,
        totalAmount: 0,
        updatedAt: Math.floor(Date.now() / 1000)
      };

      oThis.contributionUserIds.unshift(oThis.currentUserId);
    }

    // We need to update the contribution amount made by currentUserId to profileUserId.
    let userContributionAmount = new BigNumber(oThis.contributionUsersByUserIdsMap[oThis.currentUserId].totalAmount);

    for (let index = 0; index < userRows.length; index++) {
      userContributionAmount = userContributionAmount.plus(new BigNumber(userRows[index].amount));
    }

    oThis.contributionUsersByUserIdsMap[oThis.currentUserId].totalAmount = userContributionAmount.toString();

    return responseHelper.successWithData({});
  }
}

module.exports = UserContributionBy;
