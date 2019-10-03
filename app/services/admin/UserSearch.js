const bigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  UserStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  LifetimePurchaseByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/LifetimePurchaseByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  userProfileElementConstants = require(rootPrefix + '/lib/globalConstant/userProfileElement');

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
    oThis.imageIds = [];
    oThis.videoIds = [];
    oThis.userDetails = {};
    oThis.imageDetails = {};
    oThis.videos = {};
    oThis.links = {};
    oThis.allLinkIds = [];
    oThis.userToProfileElementMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.userStatsMap = {};
    oThis.tokenDetails = {};
    oThis.searchResults = [];
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.twitterUserByUserIdMap = {};
    oThis.pricePoints = {};
    oThis.userPepoCoinsMap = {};
    oThis.lifetimePurchasesMap = {};
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
      await oThis._fetchTokenUsers();

      oThis._prepareSearchResults();

      await oThis._fetchLatestVideos();

      await oThis._fetchProfileElements();

      const promisesArray = [];
      promisesArray.push(
        oThis._fetchVideos(),
        oThis._fetchLink(),
        oThis._fetchUserStats(),
        oThis._fetchTwitterUser(),
        oThis._fetchPricePoints(),
        oThis._fetchLifetimePurchases()
      );
      await Promise.all(promisesArray);
    }

    const promisesArray2 = [];
    promisesArray2.push(oThis._prepareUserPepoStatsAndCoinsMap(), oThis._fetchImages());
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
   * Fetch token users
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUserRes.data;
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

      if (userDetail.profileImageId) {
        oThis.imageIds.push(userDetail.profileImageId);
      }

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
   * Fetch profile elements.
   *
   * @sets oThis.userToProfileElementMap
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.userIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    const profileElementsData = cacheRsp.data;

    for (const userId in profileElementsData) {
      const profileElements = profileElementsData[userId];

      for (const kind in profileElements) {
        oThis._fetchElementData(userId, kind, profileElements[kind].data);
      }
    }

    for (let ind = 0; ind < oThis.searchResults.length; ind++) {
      const userId = oThis.searchResults[ind].userId;
      oThis.searchResults[ind].videoId = oThis.userToProfileElementMap[userId].videoId
        ? oThis.userToProfileElementMap[userId].videoId
        : null;
      oThis.searchResults[ind].linkId = oThis.userToProfileElementMap[userId].linkId
        ? oThis.userToProfileElementMap[userId].linkId
        : null;
    }
  }

  /**
   * Fetch element data.
   *
   * @param {number} userId
   * @param {string} kind
   * @param {object} data
   *
   * @sets oThis.allLinkIds, oThis.userToProfileElementMap
   *
   * @private
   */
  _fetchElementData(userId, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConstants.linkIdKind: {
        oThis.allLinkIds.push(data);
        oThis.userToProfileElementMap[userId].linkId = data;
        break;
      }

      default: {
        // Do nothing.
      }
    }
  }

  /**
   * Fetch videos.
   *
   * @sets oThis.imageIds, oThis.videos
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    if (oThis.videoIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (const videoId in cacheRsp.data) {
      const video = cacheRsp.data[videoId],
        posterImageId = video.posterImageId;

      if (posterImageId) {
        oThis.imageIds.push(posterImageId);
      }
    }

    oThis.videos = cacheRsp.data;
  }

  /**
   * Fetch link.
   *
   * @sets oThis.links
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchLink() {
    const oThis = this;

    if (oThis.allLinkIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UrlByIdCache({ ids: oThis.allLinkIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
  }

  /**
   * Fetch user stats.
   *
   * @sets oThis.userStatsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserStats() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UserStatByUserIdsCache({ userIds: oThis.userIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.userStatsMap = cacheRsp.data;

    await oThis._fetchInviterCodeDetails();
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
   * Fetch twitter user.
   *
   * @return {Promise<result>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: oThis.userIds
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    const twitterUserByUserIds = twitterUserByUserIdsCacheResponse.data;

    const twitterUserIds = [];

    for (let index = 0; index < oThis.userIds.length; index++) {
      const twitterUserObj = twitterUserByUserIds[oThis.userIds[index]];
      twitterUserIds.push(twitterUserObj.id);
    }

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: twitterUserIds
    }).fetch();

    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    const twitterUserByIds = twitterUserByIdsCacheResp.data;

    for (const id in twitterUserByIds) {
      const twitterUserObj = twitterUserByIds[id];
      const userId = twitterUserObj.userId;

      oThis.twitterUserByUserIdMap[userId] = twitterUserObj;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch price points.
   *
   * @sets oThis.tokenDetails, oThis.pricePoints
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const promisesArray = [];
    promisesArray.push(new SecureTokenCache({}).fetch(), new PricePointsCache({}).fetch());
    const promisesResponse = await Promise.all(promisesArray);

    const tokenDetailsResponse = promisesResponse[0];
    if (tokenDetailsResponse.isFailure()) {
      return Promise.reject(tokenDetailsResponse);
    }

    oThis.tokenDetails = tokenDetailsResponse.data;
    const stakeCurrency = oThis.tokenDetails.stakeCurrency;

    const pricePointsCacheRsp = promisesResponse[1];
    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data[stakeCurrency];
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

      const userStat = oThis.userStatsMap[userId];

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
   * Fetch images.
   *
   * @sets oThis.imageDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const imageData = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();

    oThis.imageDetails = imageData.data;
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
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      videoMap: oThis.videos,
      imageMap: oThis.imageDetails,
      linkMap: oThis.links,
      adminTwitterUsersMap: oThis.twitterUserByUserIdMap,
      tokenDetails: oThis.tokenDetails,
      userStat: oThis.userStatsMap,
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
