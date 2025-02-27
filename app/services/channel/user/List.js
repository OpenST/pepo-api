const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ChannelUsersByChannelIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ChannelUsersByChannelIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to list the channel users.
 *
 * @class ListChannelUser
 */
class ListChannelUser extends ServiceBase {
  /**
   * Constructor to list the channel users.
   *
   * @param {object} params
   * @param {number} params.channel_id
   * @param {object} params.current_user
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.currentUserId = oThis.currentUser.id;
    oThis.channelId = params.channel_id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.channelObj = null;
    oThis.channelUsers = null;
    oThis.channelUserRelationMap = {};

    oThis.page = 1;
    oThis.responseMetaData = {};
    oThis.userIds = [];
    oThis.imageIds = [];
    oThis.imageMap = [];
    oThis.usersByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchAndValidateChannel();

    await oThis._fetchChannelUsers();

    const promisesArray = [oThis._fetchUsers(), oThis._fetchTokenUsers(), oThis._setChannelUserRelations()];
    await Promise.all(promisesArray);

    await oThis._fetchImages();

    oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.page
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.page = parsedPaginationParams.page; // Override page number.
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channelObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;

    const channelByIdsCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelByIdsCacheResponse.isFailure()) {
      return Promise.reject(channelByIdsCacheResponse);
    }

    oThis.channelObj = channelByIdsCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channelObj) ||
      oThis.channelObj.status !== channelsConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_u_j_fc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelObject: oThis.channelObj
          }
        })
      );
    }
  }

  /**
   * Fetch channel users.
   *
   * @sets oThis.userIds, oThis.channelUsers
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchChannelUsers() {
    const oThis = this;

    const cacheResponse = await new ChannelUsersByChannelIdPaginationCache({
      channelId: oThis.channelId,
      limit: oThis.limit,
      page: oThis.page
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userIds = cacheResponse.data.userIds || [];
    oThis.channelUsers = cacheResponse.data.channelUserDetails;
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersByIdMap, oThis.imageIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const cacheResponse = await new UserMultiCache({ ids: oThis.userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.usersByIdMap = cacheResponse.data;

    for (const id in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[id];
      if (userObj.profileImageId) {
        oThis.imageIds.push(userObj.profileImageId);
      }
    }
  }

  /**
   * Fetch token user details from cache.
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

    const cacheResponse = await new TokenUserByUserIdsMultiCache({
      userIds: oThis.userIds
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.tokenUsersByUserIdMap = cacheResponse.data;
  }

  /**
   * Fetch channel user relations.
   *
   * @sets oThis.channelUserRelationMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setChannelUserRelations() {
    const oThis = this;

    oThis.channelUserRelationMap[oThis.channelId] = {};

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      const channelUserRelation = oThis.channelUsers[userId];

      oThis.channelUserRelationMap[oThis.channelId][userId] = {
        id: userId,
        isAdmin: 0,
        isMember: 0,
        updatedAt: Math.round(new Date() / 1000)
      };

      if (
        CommonValidators.validateNonEmptyObject(channelUserRelation) &&
        channelUserRelation.status === channelUsersConstants.activeStatus
      ) {
        oThis.channelUserRelationMap[oThis.channelId][userId] = {
          id: userId,
          isAdmin: Number(channelUserRelation.role === channelUsersConstants.adminRole),
          isMember: 1,
          updatedAt: channelUserRelation.updatedAt
        };
      }
    }
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return;
    }

    const cacheResponse = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.imageMap = cacheResponse.data;
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

    if (oThis.userIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
  }

  /**
   * Prepare final response.
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      usersByIdMap: oThis.usersByIdMap,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      userIds: oThis.userIds,
      [entityTypeConstants.channelUserRelationMap]: oThis.channelUserRelationMap,
      imageMap: oThis.imageMap,
      meta: oThis.responseMetaData
    });
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultChannelVideoListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minChannelVideoListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxChannelVideoListPageSize;
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

module.exports = ListChannelUser;
