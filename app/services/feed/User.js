const rootPrefix = '../../..',
  FeedServiceBase = require(rootPrefix + '/app/services/feed/Base'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userFeedConstants = require(rootPrefix + '/lib/globalConstant/userFeed'),
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
   * Fetch user feed ids.
   *
   * @sets oThis.feedIds
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchFeedIds() {
    const oThis = this;

    const fetchFeedIdsParams = {
      limit: oThis._currentPageLimit(),
      page: oThis.page,
      userId: oThis.profileUserId
    };

    if (!oThis.isCurrentUser) {
      fetchFeedIdsParams.privacyType = userFeedConstants.publicPrivacyType;
    }

    oThis.feedIds = await new UserFeedModel().fetchFeedIds(fetchFeedIdsParams);

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
