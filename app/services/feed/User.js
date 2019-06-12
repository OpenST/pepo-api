const rootPrefix = '../../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  UserFeedModal = require(rootPrefix + '/app/models/mysql/UserFeed'),
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

    let userFeed = await oThis._fetchUserFeed();

    oThis._setMeta();

    let finalResponse = {
      users: userFeed,
      meta: oThis.responseMetaData
    };

    return responseHelper.successWithData(finalResponse);
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
   * Fetch user feed
   *
   * @return {Result}
   */
  async _fetchUserFeed() {
    const oThis = this;

    // This value is only returned if cache is not set.
    let feedIds = await new UserFeedModal().fetchFeedIds({
      limit: oThis.limit,
      page: oThis.page,
      userId: oThis.currentUserId
    });

    let finalResponse = {};

    const FeedByIdsCacheRsp = await new FeedByIdsCache({ ids: feedIds }).fetch(),
      feedIdToFeedDetailsMap = FeedByIdsCacheRsp.data;

    for (let i = 0; i < feedIds.length; i++) {
      let feedId = feedIds[i];

      finalResponse[feedId] = feedIdToFeedDetailsMap[feedId];
      finalResponse[userId]['userName'] = userIdToUserDetailsMap[userId].userName;
      finalResponse[userId]['firstName'] = userIdToUserDetailsMap[userId].firstName;
      finalResponse[userId]['lastName'] = userIdToUserDetailsMap[userId].lastName;
    }

    return responseHelper.successWithData(finalResponse);
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
