const bigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  UserStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
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
    oThis.searchResults = [];
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.lastAdminAction = {};
    oThis.userIdToBalanceMap = {};
    oThis.pricePoints = {};
    oThis.userPepoStatsMap = {};
    oThis.userPepoCoinsMap = {};
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

    await oThis._fetchTokenUsers();

    // TODO: This thing would not be required in ideal case,
    // TODO: pepo user was created but platform was down and user was not created
    await oThis._filterNonActiveUsers();

    oThis._prepareSearchResults();

    await oThis._fetchProfileElements();

    const promisesArray = [];
    promisesArray.push(
      oThis._fetchVideos(),
      oThis._fetchLink(),
      oThis._fetchAdminActions(),
      oThis._fetchUserStats(),
      oThis._getUsersBalance()
    );
    await Promise.all(promisesArray);

    await oThis._prepareUserPepoStatsAndCoinsMap();

    await oThis._fetchImages();

    await oThis._addResponseMetaData();

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

    const userModelObj = new UserModel({});

    const userData = await userModelObj.search({
      query: oThis.query,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      fetchAll: true
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

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUserRes.data;
  }

  /**
   * Filter non active users - no platform activation.
   *
   * @return {Promise<void>}
   * @private
   */
  async _filterNonActiveUsers() {
    const oThis = this;

    console.log('===oThis.userIds==11111==', oThis.userIds);
    for (let ind = 0; ind < oThis.userIds.length; ) {
      const userId = oThis.userIds[ind];
      if (
        oThis.tokenUsersByUserIdMap[userId].hasOwnProperty('userId') &&
        oThis.tokenUsersByUserIdMap[userId].ostStatus === tokenUserConstants.activatedOstStatus
      ) {
        ind++; // Increment only if not deleted
      } else {
        oThis.userIds.splice(ind, 1);
        delete oThis.userDetails[userId];
        delete oThis.tokenUsersByUserIdMap[userId];
      }
    }

    console.log('===oThis.userIds==2222==', oThis.userIds);
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
   * Fetch images.
   *
   * @sets oThis.imageDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    const imageData = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();

    oThis.imageDetails = imageData.data;
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

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.userIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    const profileElementsData = cacheRsp.data;

    for (const userId in profileElementsData) {
      const profileElements = profileElementsData[userId];

      oThis.userToProfileElementMap[userId] = {};

      for (const kind in profileElements) {
        oThis._fetchElementData(userId, oThis.userDetails[userId], kind, profileElements[kind].data);
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
   * @param {object} userObj
   * @param {string} kind
   * @param {object} data
   *
   * @sets oThis.allLinkIds, oThis.userToProfileElementMap, oThis.videoIds
   *
   * @private
   */
  _fetchElementData(userId, userObj, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConstants.linkIdKind: {
        oThis.allLinkIds.push(data);
        oThis.userToProfileElementMap[userId].linkId = data;
        break;
      }

      case userProfileElementConstants.coverVideoIdKind: {
        oThis.videoIds.push(data);
        oThis.userToProfileElementMap[userId].videoId = data;
        break;
      }

      default: {
        // Do nothing.
      }
    }
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
  }

  /**
   * Get users balance from OST Platform.
   *
   * @sets oThis.userIdToBalanceMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getUsersBalance() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const promisesArray = [];
    const ostUserIdToPepoUserId = {};

    // Fetch balance from user.
    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index],
        ostUserId = oThis.tokenUsersByUserIdMap[userId].ostUserId;

      ostUserIdToPepoUserId[ostUserId] = userId;

      promisesArray.push(jsSdkWrapper.getUserBalance({ userId: ostUserId }));
    }

    const promisesResponse = await Promise.all(promisesArray);

    // Store user's total balance with their pepo user id.
    for (let index = 0; index < promisesResponse.length; index++) {
      const platformResponse = promisesResponse[index];
      if (platformResponse.isFailure()) {
        return Promise.reject(platformResponse);
      }

      const userBalanceObject = platformResponse.data[platformResponse.data.result_type];
      const userId = ostUserIdToPepoUserId[userBalanceObject.user_id];

      oThis.userIdToBalanceMap[userId] = userBalanceObject.total_balance;
    }
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @return {Result}
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

    return responseHelper.successWithData({});
  }

  /**
   * Fetch action taken on user by admin
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAdminActions() {
    const oThis = this;

    const adminIdMap = {};
    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    let uids = oThis.userIds;

    while (true) {
      const rows = await new AdminActivityLogModel()
        .select('*')
        .where({ action_on: uids })
        .limit(1)
        .order_by('id DESC')
        .fire();

      for (let index = 0; index < rows.length; index++) {
        const rec = rows[index];
        oThis.lastAdminAction[rec.action_on] = oThis.lastAdminAction[rec.action_on] || rec;
        adminIdMap[rec.admin_id] = 1;
      }

      uids = oThis.userIds.filter(function(val) {
        return !oThis.lastAdminAction.hasOwnProperty(val);
      });

      // If all users data is fetched or no more rows present.
      if (uids.length <= 0 || rows.length < 1) {
        break;
      }
    }

    // Fetch admin and append data in last admin actions.
    if (CommonValidators.validateNonEmptyObject(oThis.lastAdminAction)) {
      const admins = await new AdminModel()
        .select('id, name')
        .where({ id: Object.keys(adminIdMap) })
        .fire();

      for (let index = 0; index < admins.length; index++) {
        adminIdMap[admins[index].id] = admins[index];
      }

      const adminActivityObj = new AdminActivityLogModel();
      for (const userId in oThis.lastAdminAction) {
        const laa = oThis.lastAdminAction[userId];
        oThis.lastAdminAction[userId] = adminActivityObj.formatDbData(laa);
        oThis.lastAdminAction[userId].adminName = adminIdMap[laa.admin_id].name;
      }
    }
  }

  /**
   * Fetch price points.
   *
   * @sets oThis.pricePoints
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const promisesArray = [];
    promisesArray.push(new SecureTokenCache({}).fetch(), new PricePointsCache().fetch());
    const promisesResponse = await Promise.all(promisesArray);

    const tokenDetailsCacheResponse = promisesResponse[0];
    if (tokenDetailsCacheResponse.isFailure()) {
      return Promise.reject(tokenDetailsCacheResponse);
    }

    const stakeCurrency = tokenDetailsCacheResponse.data.stakeCurrency;

    const pricePointsCacheRsp = promisesResponse[1];
    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data[stakeCurrency];
  }

  /**
   * Prepare user pepo stats map (referrals, supporting count, supporters count, balance)
   * and user pepo coins map (received amount, spent amount, purchased amount, redeemed amount).
   *
   * @sets oThis.userPepoStatsMap, oThis.userPepoCoinsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareUserPepoStatsAndCoinsMap() {
    const oThis = this;

    await oThis._fetchPricePoints();

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];

      const userStat = oThis.userStatsMap[userId];

      const userBalanceInBigNumber = basicHelper.convertWeiToNormal(oThis.userIdToBalanceMap[userId]);
      const userReceivedAmountInBigNumber = basicHelper.convertWeiToNormal(userStat.totalAmountRaised);
      const userSpentAmountInBigNumber = userBalanceInBigNumber.minus(userReceivedAmountInBigNumber);

      const usdPricePointInBigNumber = new bigNumber(oThis.pricePoints.USD);
      const userBalanceInUsd = userBalanceInBigNumber.mul(usdPricePointInBigNumber).toString();
      const userReceivedAmountInUsd = userReceivedAmountInBigNumber.mul(usdPricePointInBigNumber).toString();
      const userSpentAmountInUsd = userSpentAmountInBigNumber.mul(usdPricePointInBigNumber).toString();

      oThis.userPepoStatsMap[userId] = {
        referrals: '0',
        supporting: userStat.totalContributedTo,
        supporters: userStat.totalContributedBy,
        balance: userBalanceInUsd
      };

      oThis.userPepoCoinsMap[userId] = {
        received: userReceivedAmountInUsd,
        spent: userSpentAmountInUsd,
        purchased: '0',
        redeemed: '0'
      };
    }
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
      [entityType.userSearchList]: oThis.searchResults,
      usersByIdMap: oThis.userDetails,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      videoMap: oThis.videos,
      imageMap: oThis.imageDetails,
      linkMap: oThis.links,
      adminActions: oThis.lastAdminAction, // TODO: Add formatter for admin actions.,
      userPepoStatsMap: oThis.userPepoStatsMap,
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
    return paginationConstants.defaultUserSearchPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minUserSearchPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxUserSearchPageSize;
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
