const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for unapproved reply details by parent_ids and creator_user_id cache.
 *
 * @class ReplyDetailsUnapprovedByParentIdAndCreatorUserIdCache
 */
class ReplyDetailsUnapprovedByParentIdAndCreatorUserIdCache extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.parentIds
   * @param {number} params.creatorUserId
   * @param {boolean} [params.isAdmin]
   *
   * @sets oThis.parentIds
   * @sets oThis.creatorUserId
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.creatorUserId = params.creatorUserId;
    oThis.parentIds = params.parentIds;
    oThis.isAdmin = params.isAdmin;

    if (oThis.isAdmin) {
      oThis.creatorUserId = -1;
    }
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.parentIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_cui_${oThis.creatorUserId}_pi_` + oThis.parentIds[ind]] =
        oThis.parentIds[ind];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry.
   *
   * @sets oThis.cacheExpiry
   *
   * @private
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    const fetchByIdsRsp = await new ReplyDetailsModel().fetchUnapprovedByCreatorUserIdAndParentId({
      creatorUserId: oThis.creatorUserId,
      isAdmin: oThis.isAdmin,
      parentIds: cacheMissIds
    });

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = ReplyDetailsUnapprovedByParentIdAndCreatorUserIdCache;
