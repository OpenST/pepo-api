const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user details by search
 *
 * @class UserSearch
 */
class UserSearch extends ServiceBase {
  /**
   * Constructor for user search details service.
   *
   * @param {object} params
   * @param {string} [params.q]
   * @param {string} [params.current_user]
   * @param {Boolean} [params.includeVideos] - true/false
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.query = params.q ? params.q.toLowerCase() : null;
    oThis.currentUser = params.current_user;
    oThis.includeVideos = params.includeVideos;

    oThis.userIds = [];
    oThis.imageIds = [];
    oThis.videoIds = [];
    oThis.userDetails = {};
    oThis.imageDetails = {};
    oThis.videos = {};
    oThis.videoDetails = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.searchResults = [];
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.limit = oThis._defaultPageLimit();
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

    await oThis._filterNonActiveUsers();

    await oThis._prepareSearchResults();

    if (oThis.includeVideos) {
      await oThis._fetchVideoIds();

      await oThis._fetchVideos();

      await oThis._fetchVideoDetails();
    }

    await oThis._fetchImages();

    await oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.currentUserId, oThis.paginationTimestamp
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;

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
   * Fetch user ids
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    let userModelObj = new UserModel({});

    let userData = await userModelObj.search({
      query: oThis.query,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
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
   * Filter non active users - no platform activation
   *
   * @return {Promise<void>}
   * @private
   */
  async _filterNonActiveUsers() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ) {
      let userId = oThis.userIds[ind];
      if (!oThis.tokenUsersByUserIdMap[userId].hasOwnProperty('userId')) {
        oThis.userIds.splice(ind, 1);
        delete oThis.userDetails[userId];
        delete oThis.tokenUsersByUserIdMap[userId];
      } else {
        ind++; // Increment only if not deleted
      }
    }
  }

  /**
   * Prepare search results
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareSearchResults() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      let userId = oThis.userIds[ind];
      let userDetail = oThis.userDetails[userId];

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
   * Fetch video ids
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoIds() {
    const oThis = this;

    oThis.userToVideoMap = {};

    let userProfileElementsByUserIdCache = new UserProfileElementsByUserIdCache({ usersIds: oThis.userIds });

    let cacheRsp = await userProfileElementsByUserIdCache.fetch();

    let profileElements = cacheRsp.data;

    // Fetch cover video id from profile elements
    for (let userId in profileElements) {
      let element = profileElements[userId];

      oThis.userToVideoMap[userId] = null;

      if (element.hasOwnProperty(userProfileElementConst.coverVideoIdKind)) {
        let videoId = element[userProfileElementConst.coverVideoIdKind].data;
        oThis.videoIds.push(videoId);
        oThis.userToVideoMap[userId] = videoId;
      }
    }

    for (let ind = 0; ind < oThis.searchResults.length; ind++) {
      let userId = oThis.searchResults[ind].userId;
      oThis.searchResults[ind]['videoId'] = oThis.userToVideoMap[userId];
    }
  }

  /**
   * Fetch videos
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    let cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (let videoId in cacheRsp.data) {
      let video = cacheRsp.data[videoId],
        posterImageId = video.posterImageId;

      if (posterImageId) {
        oThis.imageIds.push(posterImageId);
      }
    }

    oThis.videos = cacheRsp.data;
  }

  /**
   * Fetch video details
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    let videoDetailsByVideoIds = new VideoDetailsByVideoIds({ videoIds: oThis.videoIds });

    let cacheRsp = await videoDetailsByVideoIds.fetch();

    oThis.videoDetails = cacheRsp.data;
  }

  /**
   * Fetch images
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    let imageByIdCache = new ImageByIdCache({ ids: oThis.imageIds });

    let imageData = await imageByIdCache.fetch();

    oThis.imageDetails = imageData.data;
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
   * Prepare final response.
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    let response = {
      [entityType.userSearchList]: oThis.searchResults,
      usersByIdMap: oThis.userDetails,
      imageMap: oThis.imageDetails,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      meta: oThis.responseMetaData
    };

    if (oThis.includeVideos) {
      response['videoMap'] = oThis.videos;
      response[entityType.videoDetailsMap] = oThis.videoDetails;
    }

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
