const BigNumber = require('bignumber.js');

const rootPrefix = '../../../..',
  ContributionBase = require(rootPrefix + '/app/services/user/contribution/Base'),
  UserContributorByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/UserContributorByUserIdPagination'),
  PendingTransactionsByToUserIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByToUserIdsAndFromUserId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user contribution by (A list of users who support the current user).
 *
 * @class UserContributionBy
 */
class UserContributionBy extends ContributionBase {
  /**
   * Constructor for user contribution by (A list of users who support the current user).
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

    oThis.isCurrentUserAContributor = false;
  }

  /**
   * Fetch user ids from cache.
   *
   * @sets oThis.contributionUserIds, oThis.isCurrentUserAContributor
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

    console.log('==========oThis.contributionUsersByUserIdsMap=====111111=====', oThis.contributionUsersByUserIdsMap);

    if (oThis.contributionUsersByUserIdsMap[oThis.currentUserId]) {
      oThis.isCurrentUserAContributor = true;
    }

    if (oThis.isCurrentUserAContributor) {
      await oThis._fetchPendingTransactionsForCurrentUser();
    }

    console.log('==========oThis.contributionUsersByUserIdsMap=====2222222=====', oThis.contributionUsersByUserIdsMap);

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
