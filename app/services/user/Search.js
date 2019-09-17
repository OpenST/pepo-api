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
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
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
   * @param {Boolean} [params.search_by_admin] - true/false
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
    oThis.query = oThis.query ? oThis.query.replace(/_/g, '\\_') : null; // Escape underscore
    oThis.adminSearch = params.search_by_admin;
    oThis.isOnlyNameSearch = true;

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
    oThis.lastAdminAction = {};
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

    await oThis._prepareSearchResults();

    if (oThis.adminSearch) {
      await oThis._fetchProfileElements();

      let promises = [];
      promises.push(oThis._fetchVideos(), oThis._fetchLink(), oThis._fetchAdminActions());

      await Promise.all(promises);
    }

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

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    oThis.isOnlyNameSearch = !CommonValidators.validateUserName(oThis.query);

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
      paginationTimestamp: oThis.paginationTimestamp,
      fetchAll: oThis.adminSearch,
      isOnlyNameSearch: oThis.isOnlyNameSearch
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

    if (oThis.videoIds.length === 0) {
      return responseHelper.successWithData({});
    }

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
        oThis._fetchElementData(userId, oThis.userDetails[userId], kind, profileElements[kind].data);
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
   * @param userId
   * @param userObj
   * @param kind
   * @param data
   * @private
   */
  _fetchElementData(userId, userObj, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConst.linkIdKind:
        oThis.allLinkIds.push(data);
        oThis.userToProfileElementMap[userId]['linkId'] = data;
        break;

      case userProfileElementConst.coverVideoIdKind:
        oThis.videoIds.push(data);
        oThis.userToProfileElementMap[userId]['videoId'] = data;
        break;
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

    if (oThis.adminSearch) {
      response['videoMap'] = oThis.videos;
      response['linkMap'] = oThis.links;
      response['adminActions'] = oThis.lastAdminAction;
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

  /**
   * Fetch action taken on user by admin
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAdminActions() {
    const oThis = this;

    let uids = oThis.userIds,
      adminIdMap = {};

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    while (true) {
      let rows = await new AdminActivityLogModel()
        .select('*')
        .where({ action_on: uids })
        .limit(1)
        .order_by('id DESC')
        .fire();

      for (let i = 0; i < rows.length; i++) {
        const rec = rows[i];
        oThis.lastAdminAction[rec.action_on] = oThis.lastAdminAction[rec.action_on] || rec;
        adminIdMap[rec.admin_id] = 1;
      }

      uids = oThis.userIds.filter(function(val) {
        return !oThis.lastAdminAction.hasOwnProperty(val);
      });

      // If all users data is fetched or no more rows present
      if (uids.length <= 0 || rows.length < 1) {
        break;
      }
    }

    // Fetch admin and append data in last admin actions
    if (CommonValidators.validateNonEmptyObject(oThis.lastAdminAction)) {
      let admins = await new AdminModel()
        .select('id, name')
        .where({ id: Object.keys(adminIdMap) })
        .fire();

      for (let i = 0; i < admins.length; i++) {
        adminIdMap[admins[i].id] = admins[i];
      }

      const adminActivityObj = new AdminActivityLogModel();
      for (let userId in oThis.lastAdminAction) {
        const laa = oThis.lastAdminAction[userId];
        oThis.lastAdminAction[userId] = adminActivityObj.formatDbData(laa);
        oThis.lastAdminAction[userId].adminName = adminIdMap[laa.admin_id].name;
      }
    }
  }
}

module.exports = UserSearch;
