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
   * Constructor for user contribution to (A list of users who were supported by current user).
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

    return super._validateAndSanitizeParams();
  }

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

    console.log('==========oThis.contributionUsersByUserIdsMap=====111111=====', oThis.contributionUsersByUserIdsMap);

    if (oThis.isProfileUserCurrentUser) {
      await oThis._fetchPendingTransactionsForProfileUser();
    }

    console.log('==========oThis.contributionUsersByUserIdsMap=====2222222=====', oThis.contributionUsersByUserIdsMap);

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
      toUserIds: [oThis.contributionUserIds]
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
