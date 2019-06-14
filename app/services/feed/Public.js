const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  FeedServiceBase = require(rootPrefix + '/app/services/feed/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for public feed service.
 *
 * @class PublicFeed
 */
class PublicFeed extends FeedServiceBase {
  /**
   * Fetch feed ids.
   *
   * @sets oThis.feedIds
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchFeedIds() {
    const oThis = this;

    // TODO: @Shlok @Tejas Change the condition.
    oThis.feedIds = await new FeedModel().fetchPublicPublishedFeedIds({
      page: oThis.page,
      limit: oThis._currentPageLimit()
    });

    return responseHelper.successWithData({});
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultPublicFeedPageSize;
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minPublicFeedPageSize;
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxPublicFeedPageSize;
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

module.exports = PublicFeed;
