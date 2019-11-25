const rootPrefix = '../../..',
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get video tags details by tag id.
 *
 * @class VideoTagsDetailsByTagIdPagination
 */
class VideoTagsDetailsByTagIdPagination extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.tagId
   * @param {number} params.limit
   * @param {string} params.paginationTimestamp
   * @param {string} [params.kind]
   *
   * @sets oThis.userId, oThis.limit, oThis.paginationTimestamp, oThis.kind
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.tagId = params.tagId;

    oThis.limit = params.limit;
    oThis.paginationTimestamp = params.paginationTimestamp;
    oThis.kind = params.kind || videoTagConstants.allCacheKeyKind;
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
   * Get page cache key suffix for paginated cache.
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

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_vtd_uid_${oThis.tagId}_kd_${oThis.kind}`;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @returns {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @returns {result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const fetchUsersRsp = await new VideoTagModel().fetchByTagId({
      tagId: oThis.tagId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      kind: oThis.kind
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = VideoTagsDetailsByTagIdPagination;
