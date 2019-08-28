const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
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
   * @param {Boolean} [params.include_admin_related_details] - true/false
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.query = params.q ? params.q.toLowerCase() : null; // lower case
    oThis.query = oThis.query ? oThis.query.trim() : null; // trim spaces
    oThis.currentUser = params.current_user;
    oThis.includeAdminRelatedDetails = params.include_admin_related_details;

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

    if (oThis.includeAdminRelatedDetails) {
      await oThis._fetchProfileElements();
      await oThis._fetchVideos();
      await oThis._fetchLink();
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

    // Todo: modify search query as discussed

    let userData = await userModelObj.search({
      query: oThis.query,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      includeAdminRelatedDetails: oThis.includeAdminRelatedDetails
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
   * Fetch profile elements.
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
    let profileElementsData = cacheRsp.data;

    for (let userId in profileElementsData) {
      let profileElements = profileElementsData[userId];

      oThis.userToProfileElementMap[userId] = {};

      for (let kind in profileElements) {
        if (
          oThis.includeAdminRelatedDetails &&
          (kind === userProfileElementConst.linkIdKind || kind === userProfileElementConst.coverVideoIdKind)
        ) {
          await oThis._fetchElementData(userId, oThis.userDetails[userId], kind, profileElements[kind].data);
        }
      }
    }

    for (let ind = 0; ind < oThis.searchResults.length; ind++) {
      let userId = oThis.searchResults[ind].userId;
      oThis.searchResults[ind]['videoId'] = oThis.userToProfileElementMap[userId]['videoId']
        ? oThis.userToProfileElementMap[userId]['videoId']
        : null;
      oThis.searchResults[ind]['linkId'] = oThis.userToProfileElementMap[userId]['linkId']
        ? oThis.userToProfileElementMap[userId]['linkId']
        : null;
    }
  }

  /**
   * Fetch element data
   *
   * @param {string} userId - profile element userId
   * @param {Object} userObj - user object
   * @param {string} kind - profile element kind
   * @param {number} data - profile element data
   * @return {Promise<void>}
   * @private
   */
  async _fetchElementData(userId, userObj, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConst.linkIdKind:
        oThis.allLinkIds.push(data);
        oThis.userToProfileElementMap[userId]['linkId'] = data;
        return;

      case userProfileElementConst.coverVideoIdKind:
        oThis.videoIds.push(data);
        oThis.userToProfileElementMap[userId]['videoId'] = data;
        return;

      default:
        logger.error('Invalid profile element kind');
    }
  }

  /**
   * Fetch link
   *
   * @param linkId
   * @return {Promise<never>}
   * @private
   */
  async _fetchLink() {
    const oThis = this;

    if (oThis.allLinkIds.length == 0) {
      return responseHelper.successWithData({});
    }

    let cacheRsp = await new UrlByIdCache({ ids: oThis.allLinkIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
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

    if (oThis.includeAdminRelatedDetails) {
      response['videoMap'] = oThis.videos;
      response['linkMap'] = oThis.links;
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
