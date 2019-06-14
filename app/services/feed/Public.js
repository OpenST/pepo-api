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
   * @sets oThis.feedIds, oThis.feedIdToFeedDetailsMap
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchFeedDetails() {
    const oThis = this;

    const modelResp = await new FeedModel().fetchPublicPublishedFeedIds({
      page: oThis.page,
      limit: oThis._currentPageLimit()
    });

    oThis.feedIds = modelResp.feedIds;
    oThis.feedIdToFeedDetailsMap = modelResp.feedDetails;

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
