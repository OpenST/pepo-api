const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  InviteCodeModel = require(rootPrefix + ' /app/models/mysql/InviteCode'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for invited users of current user search.
 *
 * @class InvitedUsers
 */
class InvitedUsers extends ServiceBase {
  /**
   * Constructor for invited users of current user search.
   *
   * @param {object} params
   * @param {object} params.currentUser
   * @param {number} params.currentUser.id
   * @param {string} params.pagination_identifier
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.currentUser.id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.inviterCodeId = null;
    oThis.userIds = [];
    oThis.userDetails = {};
    oThis.paginationId = null;
    oThis.nextPaginationId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchInviterId();

    await oThis._searchInvitedUsers();

    await oThis._fetchUserDetails();

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

      oThis.paginationId = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
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
   * Search invited users.
   *
   * @sets oThis.userIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _searchInvitedUsers() {
    const oThis = this;

    oThis.userIds = await new InviteCodeModel().search({
      inviterCodeId: oThis.inviterCodeId,
      limit: oThis.limit,
      paginationId: oThis.paginationId
    });
  }

  /**
   * Fetch user details.
   *
   * @sets oThis.userDetails, oThis.nextPaginationId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserDetails() {
    const oThis = this;

    const userDetailsResponse = await new UserCache({ ids: oThis.userIds }).fetch();
    if (userDetailsResponse.isFailure()) {
      return Promise.reject(userDetailsResponse);
    }

    oThis.userDetails = userDetailsResponse.data;

    const lastUserId = oThis.userIds[oThis.userIds.length - 1];

    oThis.nextPaginationId = oThis.userDetails[lastUserId].id;
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
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const response = {
      [entityType.invitedUsersSearchList]: oThis.userIds,
      usersByIdMap: oThis.userDetails,
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
