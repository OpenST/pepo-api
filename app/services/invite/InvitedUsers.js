const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class to get invited users of current user.
 *
 * @class InvitedUsers
 */
class InvitedUsers extends ServiceBase {
  /**
   * Constructor to get invited users of current user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   * @param {string} params.pagination_identifier
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.inviterCodeId = null;
    oThis.userIds = [];
    oThis.imageIds = [];
    oThis.searchResults = [];
    oThis.userDetails = {};
    oThis.imageDetails = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.paginationId = null;
    oThis.nextPaginationId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchInviterId();

    await oThis._getInvitedUsers();

    const promisesArray = [oThis._fetchUserDetails(), oThis._fetchTokenUsers()];

    await Promise.all(promisesArray);

    oThis._prepareSearchResults();

    await oThis._fetchImages();

    oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.paginationId
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationId = parsedPaginationParams.pagination_id; // Override paginationId number.
    } else {
      oThis.paginationId = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch inviter user id of current user.
   *
   * @sets oThis.inviterCodeId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchInviterId() {
    const oThis = this;

    const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();
    if (inviteCodeByUserIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByUserIdCacheResponse);
    }

    const inviteCodeDetails = inviteCodeByUserIdCacheResponse.data[oThis.currentUserId];

    oThis.inviterCodeId = inviteCodeDetails.id;
  }

  /**
   * Get invited users.
   *
   * @sets oThis.userIds, oThis.nextPaginationId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getInvitedUsers() {
    const oThis = this;

    const queryResponse = await new InviteCodeModel().getUserIdsByInviterUserId({
      inviterCodeId: oThis.inviterCodeId,
      limit: oThis.limit,
      paginationId: oThis.paginationId
    });

    oThis.userIds = queryResponse.userIds;
    oThis.nextPaginationId = queryResponse.nextPaginationId;
  }

  /**
   * Fetch user details.
   *
   * @sets oThis.userDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const userDetailsResponse = await new UserCache({ ids: oThis.userIds }).fetch();
    if (userDetailsResponse.isFailure()) {
      return Promise.reject(userDetailsResponse);
    }

    oThis.userDetails = userDetailsResponse.data;
  }

  /**
   * Fetch token users.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const tokenUsersResponse = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();
    if (tokenUsersResponse.isFailure()) {
      return Promise.reject(tokenUsersResponse);
    }

    oThis.tokenUsersByUserIdMap = tokenUsersResponse.data;
  }

  /**
   * Prepare search results.
   *
   * @sets oThis.searchResults, oThis.imageIds
   *
   * @returns {void}
   * @private
   */
  _prepareSearchResults() {
    const oThis = this;

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      const userDetail = oThis.userDetails[userId];

      oThis.searchResults.push({
        id: index,
        userId: userId,
        updatedAt: userDetail.updatedAt
      });

      if (userDetail.profileImageId) {
        oThis.imageIds.push(userDetail.profileImageId);
      }
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
      return;
    }

    const imageData = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();

    oThis.imageDetails = imageData.data;
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.userIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_id: oThis.nextPaginationId
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
  }

  /**
   * Prepare final response.
   *
   * @returns {result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const response = {
      [entityTypeConstants.userSearchList]: oThis.searchResults,
      usersByIdMap: oThis.userDetails,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      imageMap: oThis.imageDetails,
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
    return paginationConstants.defaultInvitedUserSearchPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minInvitedUserSearchPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxInvitedUserSearchPageSize;
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

module.exports = InvitedUsers;
