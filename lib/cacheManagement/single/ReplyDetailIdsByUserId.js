const rootPrefix = '../../..',
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get reply detail ids by user id
 *
 * @class ReplyDetailIdsByUserId
 */
class ReplyDetailIdsByUserId extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.limit
   * @param {string} params.paginationTimestamp
   *
   * @sets oThis.userId, oThis.limit, oThis.paginationTimestamp
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.limit = params.limit;
    oThis.paginationTimestamp = params.paginationTimestamp;
  }

  /**
   * Return true if its a cache for pagination.
   *
   * @returns {boolean}
   * @private
   */
  _isPaginatedCache() {
    return true;
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

    oThis.useObject = false;
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
   * Get page cache key suffix for paginated cache
   *
   * @returns {string}
   * @private
   */
  _pageCacheKeySuffix() {
    const oThis = this;

    return oThis.paginationTimestamp;
  }

  /**
   * Set base cache key.
   *
   * @sets oThis.baseCacheKey
   *
   * @private
   */
  setPaginatedBaseCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_rdid_uid_${oThis.userId}`;
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

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const response = await new ReplyDetailsModel().fetchByCreatorUserId({
      creatorUserId: oThis.userId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    });

    return responseHelper.successWithData({ replyDetailIds: response.replyDetailIds, videoIds: response.videoIds });
  }
}

module.exports = ReplyDetailIdsByUserId;
