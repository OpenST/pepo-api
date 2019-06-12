const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User Feed
 *
 * @class
 */
class UserFeed extends ServiceBase {
  /**
   * Constructor for user feed
   *
   * @param params
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.current_user = params.current_user;
    oThis.currentUserId = oThis.current_user.id;
    oThis.limit = params.limit;
    oThis.paginationIdentifier = params[pagination.paginationIdentifierKey] || null;

    oThis.page = null;
    oThis.feedIds = [];
    oThis.feedIdToFeedDetailsMap = {};
    oThis.responseMetaData = {
      [pagination.nextPagePayloadKey]: {}
    };
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    oThis._fetchUserFeedIds();

    if (oThis.feedIds.length === 0) {
      return responseHelper.successWithData(oThis.finalResponse());
    }

    await oThis._fetchOstTransaction();
    await oThis._fetchGiphy();
    await oThis._fetchUsers();

    return responseHelper.successWithData(oThis.finalResponse());
  }

  /**
   * Validate and sanitize specific params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      let parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; //override page
      oThis.limit = parsedPaginationParams.limit; //override limit
    } else {
      oThis.page = 1;
      oThis.limit = oThis.limit || pagination.defaultUserFeedPageSize;
    }

    //Validate limit
    return await oThis._validatePageSize();
  }

  /**
   * Fetch user feed ids
   *
   * @return {Result}
   */
  async _fetchUserFeedIds() {
    const oThis = this;

    oThis.feedIds = await new UserFeedModel().fetchFeedIds({
      limit: oThis.limit,
      page: oThis.page,
      userId: oThis.currentUserId
    });

    const feedByIdsCacheRsp = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();
    oThis.feedIdToFeedDetailsMap = feedByIdsCacheRsp.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service Response
   *
   * @returns {Promise<void>}
   * @private
   */
  finalResponse() {
    const oThis = this,
      nextPagePayloadKey = {};

    if (oThis.feedIds.length > 0) {
      nextPagePayloadKey[pagination.paginationIdentifierKey] = {
        page: oThis.page + 1,
        limit: oThis.limit
      };
    }

    let responseMetaData = {
      [pagination.nextPagePayloadKey]: nextPagePayloadKey
    };

    let feedHash = {},
      tokenUserHash = {};

    for (let i = 0; i < oThis.feedIds.length; i++) {
      const feedId = oThis.feedIds[i],
        feed = oThis.feedIdToFeedDetailsMap[feedId];
      feedHash[feedId] = new FeedModel().safeFormattedData(feed);
    }

    let finalResponse = {
      usersByIdHash: userHash,
      tokenUsersByUserIdHash: tokenUserHash,
      userIds: oThis.userIds,
      meta: responseMetaData
    };

    return finalResponse;
  }

  /**
   * Fetch ost transactions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchOstTransaction() {
    const oThis = this;

    let usersByIdHashRes = await new UserMultiCache({ ids: oThis.userIds }).fetch();
    oThis.usersByIdHash = usersByIdHashRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch users from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    let usersByIdHashRes = await new UserMultiCache({ ids: oThis.userIds }).fetch();
    oThis.usersByIdHash = usersByIdHashRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * remove current user from final response
   *
   * @param inputDataMap {Object} - input data
   * @private
   */
  _removeCurrentUserFromResponse(inputDataMap) {
    const oThis = this;

    for (let userId in inputDataMap)
      if (oThis.currentUserId == userId) {
        delete inputDataMap[userId];
      }
  }

  /**
   * Set meta property.
   *
   * @private
   */
  _setMeta() {
    const oThis = this;

    oThis.responseMetaData[pagination.nextPagePayloadKey] = {
      [pagination.paginationIdentifierKey]: {
        page: oThis.page + 1,
        limit: oThis.limit
      }
    };
  }

  /**
   * _defaultPageLimit
   *
   * @private
   */
  _defaultPageLimit() {
    return pagination.defaultUserListPageSize;
  }

  /**
   * _minPageLimit
   *
   * @private
   */
  _minPageLimit() {
    return pagination.minUserListPageSize;
  }

  /**
   * _maxPageLimit
   *
   * @private
   */
  _maxPageLimit() {
    return pagination.maxUserListPageSize;
  }

  /**
   * _currentPageLimit
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserFeed;
