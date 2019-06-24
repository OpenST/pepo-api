const rootPrefix = '../../..',
  FeedServiceBase = require(rootPrefix + '/app/services/feed/Base'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user feed service.
 *
 * @class UserFeed
 */
class UserFeed extends FeedServiceBase {
  /**
   * Constructor for user feed service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string/number} params.current_user.id
   * @param {string/number} params.user_id
   * @param {string} [params.pagination_identifier]
   *
   * @augments FeedServiceBase
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.profileUserId = +params.user_id;

    oThis.isCurrentUser = oThis.currentUserId === oThis.profileUserId;
  }

  /**
   * Validate and sanitize params. This method validates the profileUserId and performs some
   * other validations of base class.
   *
   * @returns {Promise<*|Promise<Promise<never>|*>>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (!oThis.isCurrentUser) {
      const cacheResp = await new UserCache({ ids: [oThis.profileUserId] }).fetch();

      if (cacheResp.isFailure()) {
        return Promise.reject(cacheResp);
      }
    }

    return super._validateAndSanitizeParams();
  }

  /**
   * Fetch user feed details.
   *
   * @sets oThis.feedIds, oThis.feedIdToFeedDetailsMap, oThis.userFeedIdToFeedDetailsMap
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchFeedDetails() {
    const oThis = this;

    let modelResp = {};

    const fetchFeedIdsParams = {
      limit: oThis._currentPageLimit(),
      paginationTimestamp: oThis.paginationTimestamp,
      userId: oThis.profileUserId
    };

    if (oThis.isCurrentUser) {
      modelResp = await new UserFeedModel()._currentUserFeedIds(fetchFeedIdsParams);
    } else {
      modelResp = await new UserFeedModel()._otherUserFeedIds(fetchFeedIdsParams);
    }

    oThis.feedIds = modelResp.feedIds;
    oThis.userFeedIdToFeedDetailsMap = modelResp.userFeedIdToFeedDetailsMap;
    oThis.lastFeedId = oThis.feedIds[oThis.feedIds.length - 1];

    if (oThis.feedIds.length === 0) {
      return responseHelper.successWithData(oThis._finalResponse());
    }

    const cacheResp = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.feedIdToFeedDetailsMap = cacheResp.data;

    return responseHelper.successWithData({});
  }

  /**
   * Service response.
   *
   * @returns {*|result}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.feedIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        // TODO - think on how to remove duplicates.
        pagination_timestamp: oThis.paginationTimestamp
      };
    }

    const responseMetaData = {
      profileUserId: oThis.profileUserId,
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return {
      feedIds: oThis.feedIds,
      userFeedIdToFeedDetailsMap: oThis.userFeedIdToFeedDetailsMap,
      feedIdToFeedDetailsMap: oThis.feedIdToFeedDetailsMap,
      ostTransactionMap: oThis.ostTransactionMap,
      externalEntityGifMap: oThis.externalEntityGifMap,
      usersByIdMap: oThis.usersByIdMap,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      meta: responseMetaData
    };
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultUserFeedPageSize;
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minUserFeedPageSize;
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxUserFeedPageSize;
  }

  /**
   * Current page limit.
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserFeed;
