const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedConstant = require(rootPrefix + '/lib/globalConstant/feed'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get latest feeds cache.
 *
 * @class LatestFeed
 *
 * @augments CacheSingleBase
 */
class LatestFeed extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;
    oThis.limit = params.limit || feedConstant.personalizedFeedMaxIdsCount;
  }

  /**
   * Set use object.
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = true;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_latest_feed`;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;
    //todo feed cache time should be less???

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const feedResponse = await new FeedModel().getLatestFeedIds({ limit: oThis.limit });

    return responseHelper.successWithData(feedResponse);
  }
}

module.exports = LatestFeed;
