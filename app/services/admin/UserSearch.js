const bigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUsersVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  LifetimePurchaseByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/LifetimePurchaseByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class for user details by search for admin.
 *
 * @class UserSearch
 */
class UserSearch extends ServiceBase {
  /**
   * Constructor for user details by search for admin.
   *
   * @param {object} params
   * @param {string} [params.q]
   * @param {string} [params.pagination_identifier]
   * @param {string} [params.sort_by]
   * @param {string} [params.filter]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.query = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.sortBy = params.sort_by ? params.sort_by.toLowerCase().trim() : userConstants.descendingSortByValue;
    oThis.filter = params.filter ? params.filter.toLowerCase().trim() : null;
    oThis.isOnlyNameSearch = true;

    oThis.limit = oThis._defaultPageLimit();

    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.userDetails = {};
    oThis.userToProfileElementMap = {};
    oThis.tokenDetails = {};
    oThis.searchResults = [];
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.pricePoints = {};
    oThis.userPepoCoinsMap = {};
    oThis.lifetimePurchasesMap = {};
    oThis.usersVideosResponse = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchUserIds();

    if (oThis.userIds.length > 0) {
      oThis._prepareSearchResults();

      await oThis._fetchLatestVideos();

      await oThis._fetchUserVideos();

      const promisesArray = [];
      promisesArray.push(
        oThis._fetchPricePointsForStakeCurrency(),
        oThis._fetchLifetimePurchases(),
        oThis._fetchInviterCodeDetails()
      );
      await Promise.all(promisesArray);
    }

    const promisesArray2 = [];
    promisesArray2.push(oThis._prepareUserPepoStatsAndCoinsMap());
    await Promise.all(promisesArray2);

    oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.paginationTimestamp
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.query = oThis.query ? oThis.query.toLowerCase().trim() : null; // Lowercase and trim.

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    // Sort sent is not from options
    if (![userConstants.descendingSortByValue, userConstants.ascendingSortByValue].includes(oThis.sortBy)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_us_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_sort_by'],
          debug_options: {}
        })
      );
    }

    // Filter sent is not from known filters
    if (
      oThis.filter &&
      ![
        userConstants.approvedCreatorFilterValue,
        userConstants.deniedCreatorFilterValue,
        userConstants.pendingCreatorFilterValue
      ].includes(oThis.filter)
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_us_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_filter'],
          debug_options: {}
        })
      );
    }

    oThis.isOnlyNameSearch = !CommonValidators.validateUserName(oThis.query);

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch user ids.
   *
   * @sets oThis.userIds, oThis.userDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    const userData = await new UserModel({}).search({
      query: oThis.query,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      isOnlyNameSearch: oThis.isOnlyNameSearch,
      fetchAll: true,
      sortBy: oThis.sortBy,
      filter: oThis.filter
    });

    oThis.userIds = userData.userIds;
    oThis.userDetails = userData.userDetails;
  }

  /**
   * Prepare search results.
   *
   * @sets oThis.searchResults, oThis.nextPaginationTimestamp
   *
   * @private
   */
  _prepareSearchResults() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      const userId = oThis.userIds[ind];
      const userDetail = oThis.userDetails[userId];

      oThis.searchResults.push({
        id: ind,
        updatedAt: userDetail.updatedAt,
        userId: userId
      });

      oThis.nextPaginationTimestamp = userDetail.createdAt;
    }
  }

  /**
   * Fetch latest video ids of users.
   *
   * @sets oThis.videoIds
   *
   * @returns {Promise<number>}
   * @private
   */
  async _fetchLatestVideos() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const dbRows = await new VideoDetailModel().fetchLatestVideoId(oThis.userIds);

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      const userId = oThis.userIds[ind];
      oThis.userToProfileElementMap[userId] = oThis.userToProfileElementMap[userId] || {};

      const latestVideoId = dbRows[userId].latestVideoId;
      if (latestVideoId) {
        oThis.userToProfileElementMap[userId].videoId = dbRows[userId].latestVideoId;
        oThis.videoIds.push(dbRows[userId].latestVideoId);
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch referral count from invite codes
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchInviterCodeDetails() {
    const oThis = this;

    const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
      userIds: oThis.userIds
    }).fetch();

    if (inviteCodeByUserIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByUserIdCacheResponse);
    }

    oThis.inviteCodes = inviteCodeByUserIdCacheResponse.data;

    for (const userId in oThis.inviteCodes) {
      if (!oThis.inviteCodes[userId].hasOwnProperty('id')) {
        delete oThis.inviteCodes[userId];
      }
    }
  }

  /**
   * Fetch price points for given stake currency.
   *
   * @sets oThis.tokenDetails, oThis.pricePoints
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePointsForStakeCurrency() {
    const oThis = this;

    const tokenDetailsResponse = await new SecureTokenCache({}).fetch();
    if (tokenDetailsResponse.isFailure()) {
      return Promise.reject(tokenDetailsResponse);
    }

    oThis.tokenDetails = tokenDetailsResponse.data;
    const stakeCurrency = oThis.tokenDetails.stakeCurrency;

    oThis.pricePoints = oThis.usersVideosResponse.pricePointsMap[stakeCurrency];
  }

  /**
   * Fetch lifetime purchases for user.
   *
   * @sets oThis.lifetimePurchasesMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchLifetimePurchases() {
    const oThis = this;

    const cacheResponse = await new LifetimePurchaseByUserIdsCache({ userIds: oThis.userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.lifetimePurchasesMap = cacheResponse.data;
  }

  /**
   * Prepare user pepo stats map (referrals, supporting count, supporters count, balance)
   * and user pepo coins map (received amount, spent amount, purchased amount, redeemed amount).
   *
   * @sets oThis.userPepoCoinsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareUserPepoStatsAndCoinsMap() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];

      const userStat = oThis.usersVideosResponse.userStat[userId];

      const userReceivedAmountInBigNumber = basicHelper.convertWeiToNormal(userStat.totalAmountRaised || '0');

      const usdPricePointInBigNumber = new bigNumber(oThis.pricePoints.USD);
      const userReceivedAmountInUsd = userReceivedAmountInBigNumber.mul(usdPricePointInBigNumber).toString();

      oThis.userPepoCoinsMap[userId] = {
        received: userReceivedAmountInUsd,
        purchased: oThis.lifetimePurchasesMap[userId].amount,
        redeemed: '0'
      };
    }
  }

  /**
   * user videos and profile details
   *
   * @sets oThis.usersVideosResponse
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserVideos() {
    const oThis = this;

    const getUserVideosObj = new GetUsersVideos({
      creatorUserIds: oThis.userIds,
      currentUserId: 0,
      videoIds: oThis.videoIds,
      isAdmin: true
    });

    const response = await getUserVideosObj.perform();
    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.usersVideosResponse = response.data;
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @returns {void}
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.searchResults.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
  }

  /**
   * Prepare final response.
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const response = {
      [adminEntityType.userSearchList]: oThis.searchResults,
      usersByIdMap: oThis.userDetails,
      tokenUsersByUserIdMap: oThis.usersVideosResponse.tokenUsersByUserIdMap,
      videoMap: oThis.usersVideosResponse.videoMap,
      imageMap: oThis.usersVideosResponse.imageMap,
      linkMap: oThis.usersVideosResponse.linkMap,
      videoDescriptionsMap: oThis.usersVideosResponse.videoDescriptionMap,
      videoDetailsMap: oThis.usersVideosResponse.videoDetailsMap,
      adminTwitterUsersMap: oThis.usersVideosResponse.twitterUsersMap,
      tokenDetails: oThis.tokenDetails,
      userStat: oThis.usersVideosResponse.userStat,
      inviteCodesMap: oThis.inviteCodes,
      userPepoCoinsMap: oThis.userPepoCoinsMap,
      meta: oThis.responseMetaData
    };

    return responseHelper.successWithData(response);
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultAdminUserSearchPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minAdminUserSearchPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxAdminUserSearchPageSize;
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserSearch;
