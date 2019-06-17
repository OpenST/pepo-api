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
   * @param {number/string} [params.limit]
   * @param {string} [params.limit.pagination_identifier]
   *
   * @augments FeedServiceBase
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
    oThis.profileUserId = params.user_id;

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

    const cacheResp = await new UserCache({ ids: [oThis.profileUserId] }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(new Error(`Profile user Id ${oThis.profileUserId} is invalid.`));
    }

    return super._validateAndSanitizeParams();
  }

  /**
   * Fetch user feed details.
   *
   * @sets oThis.feedIds, oThis.feedIdToFeedDetailsMap
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchFeedDetails() {
    const oThis = this;

    const fetchFeedIdsParams = {
      limit: oThis._currentPageLimit(),
      paginationTimestamp: oThis.paginationTimestamp,
      userId: oThis.profileUserId
    };

    if (oThis.isCurrentUser) {
      oThis.feedIds = await new UserFeedModel()._currentUserFeedIds(fetchFeedIdsParams);
    } else {
      oThis.feedIds = await new UserFeedModel()._otherUserFeedIds(fetchFeedIdsParams);
    }

    const cacheResp = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(new Error(`Details for some or all of the feed Ids: ${oThis.feedIds} unavailable.`));
    }

    oThis.feedIdToFeedDetailsMap = cacheResp.data;

    oThis.lastFeedId = oThis.feedIds[oThis.feedIds.length - 1];

    return responseHelper.successWithData({});
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
